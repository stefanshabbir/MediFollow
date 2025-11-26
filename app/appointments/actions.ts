'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAppointment(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const doctorId = formData.get('doctorId') as string
    const appointmentDate = formData.get('appointmentDate') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const notes = formData.get('notes') as string

    // Get doctor's organisation_id
    const { data: doctorProfile } = await supabase
        .from('profiles')
        .select('organisation_id')
        .eq('id', doctorId)
        .single()

    if (!doctorProfile) {
        return { error: 'Doctor not found' }
    }

    const { error } = await supabase
        .from('appointments')
        .insert({
            patient_id: user.id,
            doctor_id: doctorId,
            organisation_id: doctorProfile.organisation_id,
            appointment_date: appointmentDate,
            start_time: startTime,
            end_time: endTime,
            notes: notes || null,
            status: 'pending'
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/patient')
    return { success: 'Appointment booked successfully!' }
}

export async function getAppointments(role: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    let query = supabase
        .from('appointments')
        .select(`
            *,
            patient:patient_id(full_name),
            doctor:doctor_id(full_name)
        `)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })

    if (role === 'patient') {
        query = query.eq('patient_id', user.id)
    } else if (role === 'doctor') {
        query = query.eq('doctor_id', user.id)
    } else if (role === 'admin') {
        // Admins see all appointments in their organisation
        const { data: profile } = await supabase
            .from('profiles')
            .select('organisation_id')
            .eq('id', user.id)
            .single()

        if (profile?.organisation_id) {
            query = query.eq('organisation_id', profile.organisation_id)
        }
    }

    const { data, error } = await query

    if (error) {
        return { error: error.message }
    }

    return { data }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/doctor')
    revalidatePath('/patient')
    revalidatePath('/admin')
    return { success: 'Appointment status updated!' }
}

export async function getDoctors(organisationId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    let query = supabase
        .from('profiles')
        .select('id, full_name, organisation_id, organisations(name)')
        .eq('role', 'doctor')

    if (organisationId) {
        query = query.eq('organisation_id', organisationId)
    }

    const { data, error } = await query

    if (error) {
        return { error: error.message }
    }

    return { data }
}

export async function getAvailableSlots(doctorId: string, date: string) {
    const supabase = await createClient()

    // Get day of week for the selected date (0 = Sunday, 6 = Saturday)
    const dayOfWeek = new Date(date).getDay()

    // Get doctor's schedule for this day
    const { data: scheduleData } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .single()

    // If doctor is not available on this day, return empty slots
    if (!scheduleData || !scheduleData.is_available) {
        return { data: [] }
    }

    // Get existing appointments for the doctor on this date
    const { data: appointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed'])

    // Parse doctor's working hours
    const startHour = parseInt(scheduleData.start_time.split(':')[0])
    const startMinute = parseInt(scheduleData.start_time.split(':')[1])
    const endHour = parseInt(scheduleData.end_time.split(':')[0])
    const endMinute = parseInt(scheduleData.end_time.split(':')[1])

    // Parse break times if they exist
    let breakStart: { hour: number, minute: number } | null = null
    let breakEnd: { hour: number, minute: number } | null = null

    if (scheduleData.break_start_time && scheduleData.break_end_time) {
        breakStart = {
            hour: parseInt(scheduleData.break_start_time.split(':')[0]),
            minute: parseInt(scheduleData.break_start_time.split(':')[1])
        }
        breakEnd = {
            hour: parseInt(scheduleData.break_end_time.split(':')[0]),
            minute: parseInt(scheduleData.break_end_time.split(':')[1])
        }
    }

    // Generate time slots (30-minute intervals)
    const slots = []
    let currentHour = startHour
    let currentMinute = startMinute

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`

        // Calculate end time (30 minutes later)
        let endSlotMinute = currentMinute + 30
        let endSlotHour = currentHour
        if (endSlotMinute >= 60) {
            endSlotMinute -= 60
            endSlotHour += 1
        }
        const endTime = `${endSlotHour.toString().padStart(2, '0')}:${endSlotMinute.toString().padStart(2, '0')}:00`

        // Check if slot is during break time
        const isDuringBreak = breakStart && breakEnd && (
            (currentHour > breakStart.hour || (currentHour === breakStart.hour && currentMinute >= breakStart.minute)) &&
            (currentHour < breakEnd.hour || (currentHour === breakEnd.hour && currentMinute < breakEnd.minute))
        )

        // Check if slot is already booked
        const isBooked = appointments?.some(apt => apt.start_time === startTime)

        // Only add slot if it's not booked and not during break
        if (!isBooked && !isDuringBreak) {
            slots.push({ startTime, endTime })
        }

        // Move to next slot
        currentMinute += 30
        if (currentMinute >= 60) {
            currentMinute -= 60
            currentHour += 1
        }
    }

    return { data: slots }
}

// Appointment Request Actions

export async function createAppointmentRequest(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const doctorId = formData.get('doctorId') as string
    const appointmentDate = formData.get('appointmentDate') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const notes = formData.get('notes') as string

    // Get doctor's organisation_id
    const { data: doctorProfile } = await supabase
        .from('profiles')
        .select('organisation_id')
        .eq('id', doctorId)
        .single()

    if (!doctorProfile) {
        return { error: 'Doctor not found' }
    }

    const { error } = await supabase
        .from('appointment_requests')
        .insert({
            patient_id: user.id,
            doctor_id: doctorId,
            organisation_id: doctorProfile.organisation_id,
            appointment_date: appointmentDate,
            start_time: startTime,
            end_time: endTime,
            notes: notes || null,
            status: 'pending'
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/patient')
    return { success: 'Appointment request submitted successfully! Awaiting doctor approval.' }
}

export async function getAppointmentRequests(role: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    let query = supabase
        .from('appointment_requests')
        .select(`
            *,
            patient:patient_id(full_name),
            doctor:doctor_id(full_name)
        `)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })

    if (role === 'patient') {
        query = query.eq('patient_id', user.id)
    } else if (role === 'doctor') {
        query = query.eq('doctor_id', user.id)
    } else if (role === 'admin') {
        // Admins see all requests in their organisation
        const { data: profile } = await supabase
            .from('profiles')
            .select('organisation_id')
            .eq('id', user.id)
            .single()

        if (profile?.organisation_id) {
            query = query.eq('organisation_id', profile.organisation_id)
        }
    }

    const { data, error } = await query

    if (error) {
        return { error: error.message }
    }

    return { data }
}

export async function approveAppointmentRequest(requestId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Get the request details
    const { data: request, error: fetchError } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (fetchError || !request) {
        return { error: 'Request not found' }
    }

    // Verify user is the doctor or an admin in the organisation
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organisation_id')
        .eq('id', user.id)
        .single()

    const isAuthorized = request.doctor_id === user.id ||
        (profile?.role === 'admin' && profile?.organisation_id === request.organisation_id)

    if (!isAuthorized) {
        return { error: 'Unauthorized to approve this request' }
    }

    // Create the appointment
    const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
            patient_id: request.patient_id,
            doctor_id: request.doctor_id,
            organisation_id: request.organisation_id,
            appointment_date: request.appointment_date,
            start_time: request.start_time,
            end_time: request.end_time,
            notes: request.notes,
            status: 'confirmed'
        })
        .select()
        .single()

    if (appointmentError) {
        return { error: appointmentError.message }
    }

    // Update the request status and link to appointment
    const { error: updateError } = await supabase
        .from('appointment_requests')
        .update({
            status: 'approved',
            linked_appointment_id: appointment.id
        })
        .eq('id', requestId)

    if (updateError) {
        return { error: updateError.message }
    }

    revalidatePath('/doctor')
    revalidatePath('/patient')
    revalidatePath('/admin')
    return { success: 'Appointment request approved and appointment created!' }
}

export async function rejectAppointmentRequest(requestId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Get the request to verify authorization
    const { data: request, error: fetchError } = await supabase
        .from('appointment_requests')
        .select('doctor_id, organisation_id')
        .eq('id', requestId)
        .single()

    if (fetchError || !request) {
        return { error: 'Request not found' }
    }

    // Verify user is the doctor or an admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organisation_id')
        .eq('id', user.id)
        .single()

    const isAuthorized = request.doctor_id === user.id ||
        (profile?.role === 'admin' && profile?.organisation_id === request.organisation_id)

    if (!isAuthorized) {
        return { error: 'Unauthorized to reject this request' }
    }

    const { error } = await supabase
        .from('appointment_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/doctor')
    revalidatePath('/patient')
    revalidatePath('/admin')
    return { success: 'Appointment request rejected' }
}
