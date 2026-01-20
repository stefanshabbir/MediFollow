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

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
        return { error: 'Invalid file type. Only PDF and images are allowed.' }
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
        let signedUrl = null
        if (record.file_url) {
            const { data } = await supabaseService.storage
                .from('medical-records')
                .createSignedUrl(record.file_url, 3600) // Valid for 1 hour
            signedUrl = data?.signedUrl
        }

        return {
            ...record,
            signedUrl
        }
    }))

    return { data: recordsWithUrls }
}

export async function saveNoteDraft(recordId: string | null, content: string, patientId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'doctor') {
        return { error: 'Unauthorized: Only doctors can save clinical notes' }
    }

    const supabaseService = createServiceClient()

    if (recordId) {
        // Update existing draft
        // Verify ownership and status
        const { data: existing } = await supabaseService
            .from('medical_records')
            .select('status, doctor_id')
            .eq('id', recordId)
            .single()

        if (!existing) return { error: 'Record not found' }
        if (existing.doctor_id !== user.id) return { error: 'Unauthorized' }
        if (existing.status === 'finalized') return { error: 'Cannot edit finalized note' }

        const { error } = await supabaseService
            .from('medical_records')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', recordId)

        if (error) return { error: error.message }
        return { success: true, recordId }
    } else {
        // Create new draft
        const { data, error } = await supabaseService
            .from('medical_records')
            .insert({
                patient_id: patientId,
                doctor_id: user.id,
                content,
                status: 'draft',
                // file_url and file_name are null
            })
            .select('id')
            .single()

        if (error) return { error: error.message }
        return { success: true, recordId: data.id }
    }
}

export async function finalizeNote(recordId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const supabaseService = createServiceClient()

    // 1. Get current content
    const { data: record } = await supabaseService
        .from('medical_records')
        .select('content, doctor_id, status')
        .eq('id', recordId)
        .single()

    if (!record) return { error: 'Record not found' }
    if (record.doctor_id !== user.id) return { error: 'Unauthorized' }
    if (record.status === 'finalized') return { error: 'Already finalized' }

    // 2. Archive version
    const { error: versionError } = await supabaseService
        .from('medical_record_versions')
        .insert({
            medical_record_id: recordId,
            content: record.content,
            created_by: user.id
        })

    if (versionError) return { error: 'Failed to save version: ' + versionError.message }

    // 3. Update status
    const { error: updateError } = await supabaseService
        .from('medical_records')
        .update({ status: 'finalized', updated_at: new Date().toISOString() })
        .eq('id', recordId)

    if (updateError) return { error: updateError.message }

    revalidatePath('/doctor/patients') // Revalidate liberally for now
    return { success: true }
}

export async function getNoteHistory(recordId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const supabaseService = createServiceClient()

    // Verify access (doctor who created it)
    const { data: record } = await supabaseService
        .from('medical_records')
        .select('doctor_id')
        .eq('id', recordId)
        .single()

    if (!record || record.doctor_id !== user.id) return { error: 'Unauthorized' }

    const { data: versions, error } = await supabaseService
        .from('medical_record_versions')
        .select('*')
        .eq('medical_record_id', recordId)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { data: versions }
}

export async function restoreNoteVersion(recordId: string, versionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const supabaseService = createServiceClient()

    // Verify ownership
    const { data: record } = await supabaseService
        .from('medical_records')
        .select('status, doctor_id')
        .eq('id', recordId)
        .single()

    if (!record || record.doctor_id !== user.id) return { error: 'Unauthorized' }
    if (record.status === 'finalized') return { error: 'Cannot restore to a finalized note' }

    // Get version content
    const { data: version } = await supabaseService
        .from('medical_record_versions')
        .select('content')
        .eq('id', versionId)
        .single()

    if (!version) return { error: 'Version not found' }

    // Update main record
    const { error } = await supabaseService
        .from('medical_records')
        .update({ content: version.content, updated_at: new Date().toISOString() })
        .eq('id', recordId)

    if (error) return { error: error.message }
    return { success: true }
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
