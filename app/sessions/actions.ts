'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDoctorSessions(doctorId?: string, startDate?: string, endDate?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Determine target doctor ID
    let targetDoctorId = user.id
    if (doctorId) {
        // If requesting for another doctor, verify permissions (e.g. admin or patient viewing)
        // For now, let's assume if you pass an ID, you are authorized or it's public info (for booking)
        targetDoctorId = doctorId
    }

    let query = supabase
        .from('doctor_sessions')
        .select(`
            *,
            appointments:appointments(count)
        `)
        .eq('doctor_id', targetDoctorId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

    if (startDate) {
        query = query.gte('date', startDate)
    }
    if (endDate) {
        query = query.lte('date', endDate)
    }

    const { data, error } = await query

    if (error) {
        console.error('getDoctorSessions Error:', error)
        return { error: error.message }
    }

    // Transform data to flatten the count
    const sessionsWithCount = data.map((session: any) => ({
        ...session,
        appointment_count: session.appointments?.[0]?.count || 0
    }))

    return { data: sessionsWithCount }
}

export async function createSession(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify doctor role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organisation_id')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'doctor') {
        return { error: 'Unauthorized: Only doctors can create sessions' }
    }

    const date = formData.get('date') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const label = formData.get('label') as string
    const slotDuration = parseInt(formData.get('slotDuration') as string) || 15

    if (!date || !startTime || !endTime) {
        return { error: 'Missing required fields' }
    }

    const { error } = await supabase
        .from('doctor_sessions')
        .insert({
            doctor_id: user.id,
            organisation_id: profile.organisation_id,
            date,
            start_time: startTime,
            end_time: endTime,
            label: label || null,
            slot_duration_minutes: slotDuration,
            status: 'active'
        })

    if (error) {
        console.error('createSession Error:', error)
        return { error: error.message }
    }

    revalidatePath('/doctor/sessions')
    return { success: 'Session created successfully' }
}

export async function cancelSession(sessionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership
    const { data: session } = await supabase
        .from('doctor_sessions')
        .select('doctor_id')
        .eq('id', sessionId)
        .single()

    if (!session) return { error: 'Session not found' }
    if (session.doctor_id !== user.id) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('doctor_sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId)

    if (error) return { error: error.message }

    revalidatePath('/doctor/sessions')
    return { success: 'Session cancelled' }
}
