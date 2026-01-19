import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileLayout } from '@/components/profile/profile-layout'

export default async function ProfilePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error || !profile) {
        // Handle edge case where auth user exists but profile doesn't (shouldn't happen with strict auth flow)
        return <div>Profile not found. Please contact support.</div>
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8 text-[#1e293b]">Profile Management</h1>
            <ProfileLayout profile={profile} />
        </div>
    )
}
