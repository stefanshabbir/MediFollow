'use server'

import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { revalidatePath } from 'next/cache'

// --- Types ---
export type Diagnosis = {
    id: string
    name: string
    description: string | null
}

export type TreatmentTemplate = {
    id: string
    diagnosis_id: string
    name: string
    description: string | null
    created_at: string
    steps?: TreatmentTemplateStep[]
}

export type TreatmentTemplateStep = {
    id: string
    template_id: string
    step_order: number
    title: string
    appointment_type: string
    suggested_time_gap: string | null
}

export type TreatmentPlanAppointment = {
    id: string
    plan_id: string
    step_id: string
    appointment_id: string | null
    status: 'pending' | 'scheduled' | 'completed' | 'skipped'
    step?: TreatmentTemplateStep
}

export type PatientTreatmentPlan = {
    id: string
    patient_id: string
    doctor_id: string
    diagnosis_id: string
    template_id: string | null
    status: 'active' | 'completed' | 'cancelled'
    created_at: string
    updated_at: string
    diagnosis?: Diagnosis
    template?: TreatmentTemplate
    plan_appointments?: TreatmentPlanAppointment[]
}

// --- Actions ---

export async function searchDiagnoses(query: string) {
    const supabase = await createClient()

    // Use 'ilike' for case-insensitive partial match
    const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10)

    if (error) {
        console.error('Error searching diagnoses:', error)
        return { error: error.message }
    }

    return { data: data as Diagnosis[] }
}

export async function getTreatmentTemplates(diagnosisId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('treatment_templates')
        .select(`
      *,
      steps:treatment_template_steps (
        *
      )
    `)
        .eq('diagnosis_id', diagnosisId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching templates:', error)
        return { error: error.message }
    }

    // Sort steps by order safely
    const templates = data.map((t: any) => ({
        ...t,
        steps: t.steps.sort((a: any, b: any) => a.step_order - b.step_order)
    }))

    return { data: templates }
}

export async function assignTreatmentPlan(
    patientId: string,
    diagnosisId: string,
    templateId: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify doctor role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'doctor') {
        return { error: 'Only doctors can assign treatment plans' }
    }

    // Insert plan
    const { data: plan, error } = await supabase
        .from('patient_treatment_plans')
        .insert({
            patient_id: patientId,
            doctor_id: user.id,
            diagnosis_id: diagnosisId,
            template_id: templateId,
            status: 'active'
        })
        .select()
        .single()

    if (error) {
        console.error('Error assigning plan:', error)
        return { error: error.message }
    }

    // Fetch template steps to initialize plan appointments
    const { data: templateSteps } = await supabase
        .from('treatment_template_steps')
        .select('id')
        .eq('template_id', templateId)

    if (templateSteps && templateSteps.length > 0) {
        const planAppointments = templateSteps.map(step => ({
            plan_id: plan.id,
            step_id: step.id,
            status: 'pending'
        }))

        const { error: stepsError } = await supabase
            .from('treatment_plan_appointments')
            .insert(planAppointments)

        if (stepsError) {
            console.error('Error creating plan steps:', stepsError)
        }
    }

    revalidatePath(`/doctor/patients/${patientId}`)
    return { success: true, data: plan }
}

export async function getPatientTreatmentPlans(patientId: string) {
    const supabase = await createClient()

    // Auth check: patient viewing own, or doctor viewing patient's
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Fetch profile to verify role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Strictly deny admins
    if (profile?.role === 'admin') {
        return { error: 'Admins are not authorized to view treatment plans' }
    }

    // Check access permissions
    if (user.id !== patientId) {
        // If not the patient, must be a doctor
        if (profile?.role !== 'doctor') {
            return { error: 'Unauthorized' }
        }
    }

    const { data, error } = await supabase
        .from('patient_treatment_plans')
        .select(`
      *,
      diagnosis:diagnoses(*),
      template:treatment_templates(
        *,
        steps:treatment_template_steps(*)
      ),
      plan_appointments:treatment_plan_appointments(*)
    `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (error) {
        return { error: error.message }
    }

    // Sort steps 
    const plans = data.map((p: any) => {
        if (p.template && p.template.steps) {
            p.template.steps.sort((a: any, b: any) => a.step_order - b.step_order)
        }
        return p
    })

    return { data: plans }
}
