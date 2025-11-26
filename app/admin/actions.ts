'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function inviteDoctor(formData: FormData) {
    const supabase = await createClient()

    // 1. Verify current user is an Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin' || !profile.organization_id) {
        return { error: 'Unauthorized: Only Organization Admins can invite doctors.' }
    }

    const email = formData.get('email') as string
    const fullName = formData.get('fullName') as string

    // 2. Use Service Role to invite user
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
            full_name: fullName,
            role: 'doctor',
            organization_id: profile.organization_id
        }
    })

    if (inviteError) {
        return { error: `Invitation failed: ${inviteError.message}` }
    }

    // 3. Create Profile for the invited doctor
    // Note: inviteUserByEmail creates the user in auth.users. 
    // We need to create the profile entry manually if we want it to exist before they accept?
    // Actually, we can rely on the `data` metadata to populate the profile on signup/accept?
    // Or we can insert into profiles now.
    // The user ID exists in inviteData.user.id

    if (inviteData.user) {
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: inviteData.user.id,
                role: 'doctor',
                organization_id: profile.organization_id
            })

        if (profileError) {
            // If profile creation fails, we might want to delete the invited user?
            // For now, just return error.
            return { error: `Profile creation failed: ${profileError.message}` }
        }
    }

    revalidatePath('/admin/invite')
    return { success: 'Invitation sent successfully!' }
}
