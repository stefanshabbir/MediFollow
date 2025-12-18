'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function inviteDoctor(formData: FormData) {
    const supabase = await createClient()

    // 1. Verify current user is an Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organisation_id')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin' || !profile.organisation_id) {
        return { error: 'Unauthorized: Only Organisation Admins can invite doctors.' }
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
            role: 'doctor',
            organisation_id: profile.organisation_id
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/set-password`
    })

    if (inviteError) {
        return { error: `Invitation failed: ${inviteError.message}` }
    }

    // 3. Create Profile for the invited doctor
    if (inviteData.user) {
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: inviteData.user.id,
                role: 'doctor',
                full_name: fullName,
                organisation_id: profile.organisation_id
            })

        if (profileError) {
            return { error: `Profile creation failed: ${profileError.message}` }
        }
    }

    revalidatePath('/admin/invite')
    return { success: 'Invitation sent successfully!' }
}

export async function deleteDoctor(doctorId: string) {
    const supabase = await createClient()

    // 1. Verify current user is an Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organisation_id')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin' || !profile.organisation_id) {
        return { error: 'Unauthorized: Only Organisation Admins can delete doctors.' }
    }

    // 2. Use Service Role to delete user (this will cascade to profiles if set up, or we assume manual cleanup)
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

    // Option: just delete from profiles first, or delete auth user?
    // Usually deleting auth user is cleaner.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(doctorId)

    if (deleteError) {
        return { error: `Delete failed: ${deleteError.message}` }
    }

    // We should also ensure the profile is deleted if not cascaded, but let's assume cascade or just try delete
    try {
        await supabaseAdmin.from('profiles').delete().eq('id', doctorId)
    } catch (e) {
        // Ignore if already deleted
    }

    revalidatePath('/admin')
    return { success: 'Doctor deleted successfully' }
}
