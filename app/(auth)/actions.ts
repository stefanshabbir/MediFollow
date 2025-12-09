'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

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
    revalidatePath('/', 'layout')
    redirect('/login')
}
