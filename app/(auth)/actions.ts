'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'admin') {
            revalidatePath('/admin', 'layout')
            redirect('/admin')
        } else if (profile?.role === 'doctor') {
            revalidatePath('/doctor', 'layout')
            redirect('/doctor')
        } else {
            revalidatePath('/patient', 'layout')
            redirect('/patient')
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
            data: {
                role: 'patient', // Enforce patient role
            },
        },
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp(data)

    if (signUpError) {
        return { error: signUpError.message }
    }

    if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            full_name: formData.get('fullName') as string,
            role: 'patient', // Enforce patient role
        })

        if (profileError) {
            return { error: profileError.message }
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signupOrg(formData: FormData) {
    const supabase = await createClient()

    const orgName = formData.get('orgName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    // 1. Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'admin',
            },
        },
    })

    if (signUpError) {
        return { error: signUpError.message }
    }

    if (authData.user) {
        // 2. Create the Org
        const { data: orgData, error: orgError } = await supabase
            .from('organisations')
            .insert({ name: orgName })
            .select()
            .single()

        if (orgError) {
            return { error: `Organisation creation failed: ${orgError.message}` }
        }

        // 3. Create the Profile linked to Org
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            role: 'admin',
            full_name: fullName,
            organisation_id: orgData.id,
        })

        if (profileError) {
            return { error: `Profile creation failed: ${profileError.message}` }
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/')
    redirect('/login')
}

// --- PM-005, PM-006: Change Email ---
export async function updateEmail(newEmail: string) {
    const supabase = await createClient()

    // 1. Validate Email (Zod or basic regex)
    const emailSchema = z.string().email("Invalid email format")
    const result = emailSchema.safeParse(newEmail)
    if (!result.success) {
        return { error: result.error.issues[0].message }
    }

    // 2. Auth Update (Supabase handles verification flow)
    const { data, error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
        return { error: error.message }
    }

    return {
        success: "Confirmation email sent. Please check your inbox to confirm the change.",
        pending: true
    }
}

// --- PM-007, PM-008: Change Password ---
export async function changePassword(currentPassword: string, newPassword: string) {
    const supabase = await createClient()

    // 1. Password Strength Validation (PM-008 - basic check here, Zod in UI)
    if (newPassword.length < 8) {
        return { error: "Password must be at least 8 characters long" }
    }

    // 2. Update Password 
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return { error: "Unauthorized" }

    // Re-verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
    })

    if (signInError) {
        return { error: "Incorrect current password" }
    }

    // Set new password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
        return { error: updateError.message }
    }

    return { success: "Password updated successfully" }
}

// --- PM-030: Soft Delete ---
export async function softDeleteAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Update profiles table
    const { error } = await supabase
        .from('profiles')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        return { error: "Failed to deactivate account" }
    }

    // Sign out
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    // Client should redirect to login
    return { success: "Account deactivated" }
}
