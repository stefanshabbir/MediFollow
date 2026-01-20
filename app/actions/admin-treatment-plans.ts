'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Types ---
export type DiagnosisInput = {
    name: string
    description?: string
}

export type TemplateInput = {
    diagnosis_id: string
    name: string
    description?: string
}

export type TemplateStepInput = {
    template_id: string
    step_order: number
    title: string
    appointment_type: string
    suggested_time_gap?: string
}

// --- Admin Actions ---

async function verifyAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized', supabase: null, user: null }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Only admins can perform this action', supabase: null, user: null }
    }

    return { error: null, supabase, user }
}

// --- Diagnoses ---

export async function getAllDiagnoses() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .order('name')

    if (error) return { error: error.message }
    return { data }
}

export async function createDiagnosis(input: DiagnosisInput) {
    const { error: authError, supabase } = await verifyAdmin()
    if (authError || !supabase) return { error: authError }

    const { data, error } = await supabase
        .from('diagnoses')
        .insert({ name: input.name, description: input.description || null })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/treatment-plans')
    return { success: true, data }
}

export async function updateDiagnosis(id: string, input: DiagnosisInput) {
    const { error: authError, supabase } = await verifyAdmin()
    if (authError || !supabase) return { error: authError }

    const { error } = await supabase
        .from('diagnoses')
        .update({ name: input.name, description: input.description || null })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/treatment-plans')
    return { success: true }
}

export async function deleteDiagnosis(id: string) {
    const { error: authError, supabase } = await verifyAdmin()
    if (authError || !supabase) return { error: authError }

    const { error } = await supabase.from('diagnoses').delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/treatment-plans')
    return { success: true }
}

// --- Templates ---

export async function getTemplatesForDiagnosis(diagnosisId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('treatment_templates')
        .select(`
            *,
            steps:treatment_template_steps(*)
        `)
        .eq('diagnosis_id', diagnosisId)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }

    // Sort steps
    const templates = data.map((t: any) => ({
        ...t,
        steps: t.steps.sort((a: any, b: any) => a.step_order - b.step_order)
    }))

    return { data: templates }
}

export async function createTemplate(input: TemplateInput) {
    const { error: authError, supabase } = await verifyAdmin()
    if (authError || !supabase) return { error: authError }

    const { data, error } = await supabase
        .from('treatment_templates')
        .insert({
            diagnosis_id: input.diagnosis_id,
            name: input.name,
            description: input.description || null
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/treatment-plans')
    return { success: true, data }
}

export async function deleteTemplate(id: string) {
    const { error: authError, supabase } = await verifyAdmin()
    if (authError || !supabase) return { error: authError }

    const { error } = await supabase.from('treatment_templates').delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/treatment-plans')
    return { success: true }
}

// --- Template Steps ---

export async function addTemplateStep(input: TemplateStepInput) {
    const { error: authError, supabase } = await verifyAdmin()
    if (authError || !supabase) return { error: authError }

    const { data, error } = await supabase
        .from('treatment_template_steps')
        .insert({
            template_id: input.template_id,
            step_order: input.step_order,
            title: input.title,
            appointment_type: input.appointment_type,
            suggested_time_gap: input.suggested_time_gap || null
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/treatment-plans')
    return { success: true, data }
}

export async function deleteTemplateStep(id: string) {
    const { error: authError, supabase } = await verifyAdmin()
    if (authError || !supabase) return { error: authError }

    const { error } = await supabase.from('treatment_template_steps').delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/treatment-plans')
    return { success: true }
}
