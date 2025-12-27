'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'
import { createServiceClient } from '@/utils/supabase/service'
import {
    getAppointmentConfirmationEmail,
    getAppointmentRequestEmail,
    getAppointmentApprovalEmail,
    getAppointmentRejectionEmail,
    getAppointmentCancellationEmail,
    getAppointmentReminderEmail
} from '@/lib/email-templates'

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
    const previousAppointmentId = formData.get('previousAppointmentId') as string

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
            status: 'pending',
            previous_appointment_id: previousAppointmentId || null
        })



    if (error) {
        return { error: error.message }
    }

    console.log('[CreateAppointment] User email:', user.email, 'Doctor ID:', doctorId)

    // Send confirmation email to patient
    if (user.email && doctorProfile) {
        console.log('[CreateAppointment] Attempting to send email to', user.email)
        // Fetch doctor's name for email
        const { data: doctor } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', doctorId)
            .single()

        await sendEmail({
            to: user.email,
            subject: 'Appointment Confirmation - MediFollow',
            text: `Your appointment with ${doctor?.full_name} on ${appointmentDate} at ${startTime} has been booked.`,
            html: getAppointmentConfirmationEmail(
                user.user_metadata?.full_name || 'Patient',
                doctor?.full_name || 'Doctor',
                appointmentDate,
                startTime
            )
        })
    }

    revalidatePath('/patient')
    return { success: 'Appointment booked successfully!' }
}

export async function scheduleFollowUp(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const previousAppointmentId = formData.get('previousAppointmentId') as string
    const appointmentDate = formData.get('appointmentDate') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const notes = formData.get('notes') as string

    // Get previous appointment to verify access and get patient_id
    const { data: previousAppointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', previousAppointmentId)
        .single()

    if (fetchError || !previousAppointment) {
        return { error: 'Previous appointment not found' }
    }

    // Verify user is the doctor or admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organisation_id')
        .eq('id', user.id)
        .single()

    const isAuthorized = previousAppointment.doctor_id === user.id ||
        (profile?.role === 'admin' && profile?.organisation_id === previousAppointment.organisation_id)

    if (!isAuthorized) {
        return { error: 'Unauthorized to schedule follow-up for this appointment' }
    }

    const { error } = await supabase
        .from('appointments')
        .insert({
            patient_id: previousAppointment.patient_id,
            doctor_id: previousAppointment.doctor_id, // Same doctor
            organisation_id: previousAppointment.organisation_id,
            appointment_date: appointmentDate,
            start_time: startTime,
            end_time: endTime,
            notes: notes || null,
            status: 'confirmed', // Follow-ups scheduled by doctor are confirmed
            previous_appointment_id: previousAppointmentId
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/doctor')
    revalidatePath('/patient')
    return { success: 'Follow-up appointment scheduled!' }
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
        console.error("getAppointments Error:", error)
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

export async function cancelAppointment(appointmentId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('patient_id', user.id) // Ensure only the patient can cancel their own appointment

    if (error) {
        return { error: error.message }
    }

    // Send cancellation email to doctor
    // Get appointment details first to know who to email
    const { data: appointment } = await supabase
        .from('appointments')
        .select(`
            doctor_id,
            appointment_date,
            start_time,
            doctor:doctor_id(full_name),
            patient:patient_id(full_name)
        `)
        .eq('id', appointmentId)
        .single()

    if (appointment) {
        // We need to fetch the doctor's email using admin client since we are in patient context
        const { data: doctorUser } = await supabase.auth.admin.getUserById(appointment.doctor_id)

        if (doctorUser?.user?.email) {
            const patientName = user.user_metadata?.full_name || 'Patient'
            // @ts-ignore
            const doctorName = appointment.doctor?.full_name || 'Doctor'

            await sendEmail({
                to: doctorUser.user.email,
                subject: 'Appointment Cancelled - MediFollow',
                text: `The appointment with ${patientName} on ${appointment.appointment_date} has been cancelled.`,
                html: getAppointmentCancellationEmail(
                    doctorName,
                    patientName,
                    appointment.appointment_date,
                    appointment.start_time
                )
            })
        }
    }

    revalidatePath('/patient')
    return { success: 'Appointment cancelled successfully' }
}

export async function getDoctors(organisationId?: string) {
    // Check if user is authenticated (optional but good practice)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Use Admin client to bypass RLS for public directory listing
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

    let query = supabaseAdmin
        .from('profiles')
        .select('id, organisation_id, full_name')
        .eq('role', 'doctor')

    if (organisationId) {
        query = query.eq('organisation_id', organisationId)
    }

    const { data, error } = await query

    if (error) {
        console.error("getDoctors Error:", error)
        return { error: error.message }
    }

    console.log("getDoctors Data:", data?.length)
    return { data }
}


export async function getOrganisations() {
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

    const { data, error } = await supabaseAdmin
        .from('organisations')
        .select('id, name')

    if (error) {
        console.error("getOrganisations Error:", error)
        return { error: error.message }
    }

    console.log("getOrganisations Data:", data?.length)
    return { data }
}

export async function getAvailableSlots(doctorId: string, date: string) {
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

    // Get day of week for the selected date (0 = Sunday, 6 = Saturday)
    const dayOfWeek = new Date(date).getDay()

    // Get doctor's schedule for this day
    const { data: scheduleData, error: scheduleError } = await supabaseAdmin
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .single()

    if (scheduleError) {
        console.error("getAvailableSlots Error (Schedule):", scheduleError)
    }

    // If doctor is not available on this day, return empty slots
    if (!scheduleData || !scheduleData.is_available) {
        return { data: [] }
    }

    // Get existing appointments for the doctor on this date
    const { data: appointments, error: appointmentError } = await supabaseAdmin
        .from('appointments')
        .select('start_time, end_time')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed'])

    if (appointmentError) {
        console.error("getAvailableSlots Error (Appointments):", appointmentError)
    }

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
        .select('organisation_id, full_name')
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

    // Send request received email
    if (user.email && doctorProfile) {
        console.log('[CreateRequest] Sending request email to', user.email)
        await sendEmail({
            to: user.email,
            subject: 'Appointment Request Received - MediFollow',
            text: `Your appointment request with ${doctorProfile.full_name} for ${appointmentDate} at ${startTime} has been received.`,
            html: getAppointmentRequestEmail(
                user.user_metadata?.full_name || 'Patient',
                doctorProfile.full_name || 'Doctor',
                appointmentDate,
                startTime
            )
        })
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
        console.error("getAppointmentRequests Error:", error)
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

    // Send approval email to patient
    const { data: patientUser, error: patientError } = await supabase.auth.admin.getUserById(request.patient_id)
    console.log('[ApproveRequest] Patient ID:', request.patient_id, 'Email:', patientUser?.user?.email)

    if (patientUser?.user?.email && !patientError) {
        console.log('[ApproveRequest] Sending approval email')

        // Get doctor details for email
        const { data: doctor } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id) // Current user is doctor/admin approving
            .single()

        await sendEmail({
            to: patientUser.user.email,
            subject: 'Appointment Approved - MediFollow',
            text: `Your appointment request with ${doctor?.full_name} for ${request.appointment_date} at ${request.start_time} has been approved.`,
            html: getAppointmentApprovalEmail(
                patientUser.user.user_metadata?.full_name || 'Patient',
                doctor?.full_name || 'Doctor',
                request.appointment_date,
                request.start_time
            )
        })
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
        .select('doctor_id, organisation_id, patient_id, appointment_date')
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

    // Send rejection email to patient
    const { data: patientUser, error: patientError } = await supabase.auth.admin.getUserById(request.patient_id)

    if (patientUser?.user?.email && !patientError) {
        // Get doctor details for email
        const { data: doctor } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        await sendEmail({
            to: patientUser.user.email,
            subject: 'Appointment Request Update - MediFollow',
            text: `Your appointment request with ${doctor?.full_name} for ${request.appointment_date} has been declined.`,
            html: getAppointmentRejectionEmail(
                patientUser.user.user_metadata?.full_name || 'Patient',
                doctor?.full_name || 'Doctor',
                request.appointment_date
            )
        })
    }

    revalidatePath('/doctor')
    revalidatePath('/patient')
    revalidatePath('/admin')
    return { success: 'Appointment request rejected' }
}

type ReminderAppointment = {
    id: string
    patient_id: string
    doctor_id: string
    appointment_date: string
    start_time: string
    status: string
    reminder_sent_at: string | null
    patient: { full_name: string | null } | null
    doctor: { full_name: string | null } | null
}

function toUtcDate(date: string, time: string) {
    return new Date(`${date}T${time}Z`)
}

export async function sendUpcomingAppointmentReminders(lookaheadHours = 24, windowHours = 1) {
    const supabase = createServiceClient()

    const windowStart = new Date(Date.now() + lookaheadHours * 60 * 60 * 1000)
    const windowEnd = new Date(windowStart.getTime() + windowHours * 60 * 60 * 1000)

    const { data, error } = await supabase
        .from('appointments')
        .select(`
            id,
            patient_id,
            doctor_id,
            appointment_date,
            start_time,
            status,
            reminder_sent_at,
            patient:patient_id(full_name),
            doctor:doctor_id(full_name)
        `)
        .in('status', ['pending', 'confirmed'])
        .is('reminder_sent_at', null)
        .gte('appointment_date', windowStart.toISOString().slice(0, 10))
        .lte('appointment_date', windowEnd.toISOString().slice(0, 10))

    if (error) {
        return { error: error.message }
    }

    const upcoming = (data as unknown as ReminderAppointment[] | null)?.filter((appt) => {
        const start = toUtcDate(appt.appointment_date, appt.start_time)
        return start >= windowStart && start <= windowEnd
    }) || []

    if (!upcoming.length) {
        return { success: 'No reminders to send' }
    }

    const userIds = Array.from(new Set(upcoming.flatMap((appt) => [appt.patient_id, appt.doctor_id])))
    const emailMap = new Map<string, string>()
    const emailErrors: string[] = []

    for (const id of userIds) {
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(id)
        if (user?.user?.email) {
            emailMap.set(id, user.user.email)
        } else if (userError) {
            emailErrors.push(`Failed to load email for ${id}: ${userError.message}`)
        }
    }

    const sent: string[] = []
    const failed: { id: string; reason: string }[] = []

    for (const appt of upcoming) {
        const appointmentDate = toUtcDate(appt.appointment_date, appt.start_time)
        const patientEmail = emailMap.get(appt.patient_id)
        const doctorEmail = emailMap.get(appt.doctor_id)

        if (!patientEmail && !doctorEmail) {
            failed.push({ id: appt.id, reason: 'Missing both patient and doctor emails' })
            continue
        }

        const subject = 'Appointment Reminder'
        const readableTime = appointmentDate.toUTCString()
        const body = `This is a reminder that an appointment is scheduled for ${readableTime}.` +
            `\nStatus: ${appt.status}`

        const sends: Promise<unknown>[] = []
        if (patientEmail) {
            // Check if patient is array or object and access full_name accordingly
            // @ts-ignore
            const patientName = Array.isArray(appt.patient) ? appt.patient[0]?.full_name : appt.patient?.full_name
            // @ts-ignore
            const doctorName = Array.isArray(appt.doctor) ? appt.doctor[0]?.full_name : appt.doctor?.full_name

            sends.push(sendEmail({
                to: patientEmail,
                subject,
                text: `Hello ${patientName || 'there'},\n\n${body}\n\n` +
                    'If you have any questions, please contact your provider.',
                html: getAppointmentReminderEmail(
                    patientName || 'Patient',
                    doctorName || 'Doctor',
                    appt.appointment_date,
                    appt.start_time,
                    appt.status
                )
            }))
        }

        if (doctorEmail) {
            // @ts-ignore
            const patientName = Array.isArray(appt.patient) ? appt.patient[0]?.full_name : appt.patient?.full_name
            // @ts-ignore
            const doctorName = Array.isArray(appt.doctor) ? appt.doctor[0]?.full_name : appt.doctor?.full_name

            sends.push(sendEmail({
                to: doctorEmail,
                subject,
                text: `Hello ${doctorName || 'Doctor'},\n\n${body}\n\n` +
                    'Please ensure the time is reserved on your calendar.',
                html: getAppointmentReminderEmail(
                    doctorName || 'Doctor',
                    patientName || 'Patient',
                    appt.appointment_date,
                    appt.start_time,
                    appt.status
                )
            }))
        }

        try {
            await Promise.all(sends)
            await supabase
                .from('appointments')
                .update({ reminder_sent_at: new Date().toISOString() })
                .eq('id', appt.id)
            sent.push(appt.id)
        } catch (sendError) {
            failed.push({ id: appt.id, reason: sendError instanceof Error ? sendError.message : 'Unknown error' })
        }
    }

    return {
        success: `Sent ${sent.length} reminder(s)`,
        sent,
        failed,
        emailErrors,
    }
}
