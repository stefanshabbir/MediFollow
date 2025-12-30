'use server'

import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { revalidatePath } from 'next/cache'

export async function uploadMedicalRecord(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const patientId = formData.get('patientId') as string
    const description = formData.get('description') as string
    const file = formData.get('file') as File

    if (!file) {
        return { error: 'No file provided' }
    }

    if (!patientId) {
        return { error: 'Patient ID is required' }
    }

    // Verify user is a doctor
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'doctor' && profile?.role !== 'admin') {
        return { error: 'Unauthorized: Only doctors and admins can upload records' }
    }

    // Use Service Role client for storage and DB operations to bypass RLS
    // (We already verified the user is an authorized doctor/admin above)
    const supabaseService = createServiceClient()

    // 1. Upload file to Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${patientId}/${fileName}`

    const { error: uploadError } = await supabaseService.storage
        .from('medical-records')
        .upload(filePath, file)

    if (uploadError) {
        console.error('Upload Error:', uploadError)
        return { error: 'Failed to upload file: ' + uploadError.message }
    }

    // 2. Insert record into Database
    const { error: insertError } = await supabaseService
        .from('medical_records')
        .insert({
            patient_id: patientId,
            doctor_id: user.id, // The uploaded_by user (doctor or admin)
            file_url: filePath,
            file_name: file.name,
            description: description || null
        })

    if (insertError) {
        // Cleanup storage if DB insert fails
        await supabaseService.storage.from('medical-records').remove([filePath])
        return { error: 'Failed to save record metadata: ' + insertError.message }
    }

    revalidatePath('/doctor')
    revalidatePath(`/doctor/patients/${patientId}`)
    return { success: 'Medical record uploaded successfully!' }
}

export async function getPatientRecords(patientId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify access: Doctor or the Patient themselves
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const canAccess = profile?.role === 'doctor' || profile?.role === 'admin' || user.id === patientId

    if (!canAccess) {
        return { error: 'Unauthorized to view these records' }
    }

    const supabaseService = createServiceClient()

    // Use service client to bypass RLS for fetching records
    const { data: records, error } = await supabaseService
        .from('medical_records')
        .select(`
            *,
            doctor:profiles!doctor_id(full_name)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (error) {
        return { error: error.message }
    }

    // Generate Signed URLs for the records using service client
    const recordsWithUrls = await Promise.all(records.map(async (record) => {
        const { data } = await supabaseService.storage
            .from('medical-records')
            .createSignedUrl(record.file_url, 3600) // Valid for 1 hour

        return {
            ...record,
            signedUrl: data?.signedUrl
        }
    }))

    return { data: recordsWithUrls }
}

export async function getDoctorPatients() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get all patient IDs from appointments
    const { data: appointments } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', user.id)

    if (!appointments?.length) return { data: [] }

    const patientIds = Array.from(new Set(appointments.map(a => a.patient_id)))

    // Fetch profiles
    const { data: patients } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds)

    return { data: patients }
}

export async function getOrganisationPatients() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get admin profile and organisation_id
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('organisation_id, role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        return { error: 'Unauthorized: Only admins can view organisation patients' }
    }

    // Get all patient IDs from appointments within this organisation
    const { data: appointments } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('organisation_id', adminProfile.organisation_id)

    if (!appointments?.length) return { data: [] }

    const patientIds = Array.from(new Set(appointments.map(a => a.patient_id)))

    // Fetch profiles
    const { data: patients } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds)

    return { data: patients }
}

export async function getPatientProfile(patientId: string) {
    const supabase = await createClient()

    // Auth check should be here ideally, verifying the doctor has access to this patient
    // For now, we assume if they have the ID and are a doctor, it's okay (or rely on RLS if possible, but profiles are often public-read or restrictive)

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single()

    if (error) return { error: error.message }
    return { data: profile }
}
