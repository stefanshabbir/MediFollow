'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDoctorSchedule(doctorId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // If no doctorId provided, get current user's schedule
    const targetDoctorId = doctorId || user.id

    const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', targetDoctorId)
        .order('day_of_week', { ascending: true })

    if (error) {
        return { error: error.message }
    }

    // If no schedule exists, initialize default schedule
    if (!data || data.length === 0) {
        const { error: initError } = await supabase.rpc('initialize_doctor_schedule', {
            p_doctor_id: targetDoctorId
        })

        if (initError) {
            return { error: initError.message }
        }

        // Fetch again after initialization
        const { data: newData, error: fetchError } = await supabase
            .from('doctor_schedules')
            .select('*')
            .eq('doctor_id', targetDoctorId)
            .order('day_of_week', { ascending: true })

        if (fetchError) {
            return { error: fetchError.message }
        }

        return { data: newData }
    }

    return { data }
}

export async function updateDoctorSchedule(scheduleId: string, updates: {
    is_available?: boolean
    start_time?: string
    end_time?: string
    break_start_time?: string | null
    break_end_time?: string | null
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('doctor_schedules')
        .update(updates)
        .eq('id', scheduleId)
        .eq('doctor_id', user.id) // Ensure doctor can only update their own schedule

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/doctor/schedule')
    return { success: 'Schedule updated successfully!' }
}

export async function bulkUpdateSchedule(schedules: Array<{
    id: string
    is_available?: boolean
    start_time?: string
    end_time?: string
    break_start_time?: string | null
    break_end_time?: string | null
}>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Update each schedule
    for (const schedule of schedules) {
        const { id, ...updates } = schedule
        await supabase
            .from('doctor_schedules')
            .update(updates)
            .eq('id', id)
            .eq('doctor_id', user.id)
    }

    revalidatePath('/doctor/schedule')
    return { success: 'Schedule updated successfully!' }
}
