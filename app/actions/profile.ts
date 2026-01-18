'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

// --- Validation Schemas ---
const profileSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
    phone: z.string().optional().refine((val) => !val || isValidPhoneNumber(val), {
        message: "Invalid phone number format",
    }),
    bio: z.string().max(2000, "Bio exceeds 2000 characters").optional(),
    specialization: z.string().max(100).optional(),
    preferences: z.object({
        privacy_settings: z.object({
            is_public: z.boolean().default(false),
        }).optional(),
        notifications: z.object({
            email_updates: z.boolean().default(true),
            in_app: z.boolean().default(true),
        }).optional(),
        language: z.string().default("en"),
        timezone: z.string().default("UTC"),
    }).optional(),
    certifications: z.array(z.object({
        name: z.string(),
        url: z.string(),
        upload_date: z.string(),
    })).optional(),
    avatar_url: z.string().optional(),
    address: z.string().max(200, "Address too long").optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// --- Helper: Audit Logging ---
async function logAudit(supabase: any, userId: string, action: string, changes: any) {
    const { error } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        details: changes,
    })
    if (error) console.error("Audit Log Error:", error)
}

// --- Action: Update Profile ---
export async function updateProfile(formData: ProfileFormData) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Unauthorized" }
    }

    // 2. Fetch Current Profile (for Audit Diff & Role Check)
    const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (fetchError || !currentProfile) {
        return { error: "Profile not found" }
    }

    if (currentProfile.is_deleted) {
        return { error: "Account is deactivated" }
    }

    // 3. Validation
    const validatedFields = profileSchema.safeParse(formData)
    if (!validatedFields.success) {
        return { error: "Validation failed", details: validatedFields.error.flatten().fieldErrors }
    }
    const data = validatedFields.data

    // 4. Sanitation (PM-024)
    if (data.bio) {
        data.bio = DOMPurify.sanitize(data.bio) // Remove scripts
    }
    if (data.full_name) {
        data.full_name = DOMPurify.sanitize(data.full_name)
    }
    if (data.address) {
        data.address = DOMPurify.sanitize(data.address)
    }
    // Website is validated by Zod as URL, but good to be safe if rendering HTML, though usually used in href.

    // 5. Normalization (PM-027)
    if (data.phone) {
        const phoneNumber = parsePhoneNumber(data.phone)
        if (phoneNumber) {
            data.phone = phoneNumber.format('E.164')
        }
    }

    // 6. Role-Based Sanitation (PM-028)
    // Prevent patients from updating 'specialization' or 'certifications' if they try to bypass UI
    if (currentProfile.role === 'patient') {
        delete data.specialization
        delete data.certifications
    }

    // 7. Audit Log Diff Calculation (PM-025)
    const changes: Record<string, { old: any, new: any }> = {}
    let hasChanges = false
    for (const key in data) {
        // @ts-ignore
        const newValue = data[key]
        const oldValue = currentProfile[key]

        // Simple equality check (shallow for primitives, JSON stringify for objects)
        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
            changes[key] = { old: oldValue, new: newValue }
            hasChanges = true
        }
    }

    if (!hasChanges) {
        return { success: "No changes detected" }
    }

    // 8. Update Database
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (updateError) {
        return { error: "Update failed: " + updateError.message }
    }

    // 9. Log Audit (PM-021 - concurrent edits will just be logged sequentially)
    await logAudit(supabase, user.id, "PROFILE_UPDATE", changes)

    // 10. Revalidate
    revalidatePath('/profile')
    revalidatePath(`/public/${user.id}`) // Revalidate public view

    return { success: "Profile updated successfully" }
}
