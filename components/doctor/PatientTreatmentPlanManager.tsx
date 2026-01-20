"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    assignTreatmentPlan,
    getTreatmentTemplates,
    type Diagnosis,
    type TreatmentTemplate,
    type TreatmentTemplateStep,
    type PatientTreatmentPlan
} from "@/app/actions/treatment-plan"
import { DiagnosisAutocomplete } from "./DiagnosisAutocomplete"
import { TreatmentWorkflowPreview } from "./TreatmentWorkflowPreview"
import { Loader2 } from "lucide-react"

interface PatientTreatmentPlanManagerProps {
    patientId: string
    activePlan: PatientTreatmentPlan | null
}

export function PatientTreatmentPlanManager({ patientId, activePlan }: PatientTreatmentPlanManagerProps) {
    const [plan, setPlan] = useState<PatientTreatmentPlan | null>(activePlan)
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null)
    const [templates, setTemplates] = useState<(TreatmentTemplate & { steps: TreatmentTemplateStep[] })[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<(TreatmentTemplate & { steps: TreatmentTemplateStep[] }) | null>(null)
    const [loadingTemplates, setLoadingTemplates] = useState(false)
    const [assigning, setAssigning] = useState(false)

    const handleDiagnosisSelect = async (diagnosis: Diagnosis) => {
        setSelectedDiagnosis(diagnosis)
        setLoadingTemplates(true)
        setSelectedTemplate(null)

        const result = await getTreatmentTemplates(diagnosis.id)
        if (result.data) {
            setTemplates(result.data)
            // Auto-select first template if available
            if (result.data.length > 0) {
                setSelectedTemplate(result.data[0])
            }
        } else if (result.error) {
            toast.error(result.error)
        }

        setLoadingTemplates(false)
    }

    const handleAssignPlan = async () => {
        if (!selectedDiagnosis || !selectedTemplate) return

        setAssigning(true)
        const result = await assignTreatmentPlan(patientId, selectedDiagnosis.id, selectedTemplate.id)

        if (result.success) {
            toast.success("Treatment plan assigned successfully")
            // Optimistically update or just wait for revalidate (server action revalidates path)
            // But we need to update local state since we are in a client component and page update might not reflect deep prop changes immediately without router refresh
            // However, server action revalidatePath should trigger a router refresh.
            // We'll trust the revalidate.

            // Actually, result.data contains the new plan, but without relationships fully loaded maybe?
            // Let's reload page logic manually or just wait.
            // For better UX, let's just confirm.
            window.location.reload()
        } else {
            toast.error(result.error)
        }
        setAssigning(false)
    }

    if (plan) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Active Treatment Plan</CardTitle>
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                    </div>
                    <CardDescription>
                        Diagnosis: <span className="font-medium text-foreground">{plan.diagnosis?.name}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {plan.template && plan.template.steps && (
                        <div className="space-y-4">
                            <TreatmentWorkflowPreview
                                template={{
                                    ...plan.template,
                                    steps: plan.template.steps as any // Type assertion for now due to potentially loose types from join
                                }}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Assign Treatment Plan</CardTitle>
                <CardDescription>Select a diagnosis and workflow template to start a treatment plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Diagnosis</label>
                    <DiagnosisAutocomplete onSelect={handleDiagnosisSelect} />
                </div>

                {loadingTemplates && (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {selectedDiagnosis && !loadingTemplates && templates.length === 0 && (
                    <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                        No templates found for this diagnosis.
                    </div>
                )}

                {templates.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Protocol</label>
                            <div className="flex flex-wrap gap-2">
                                {templates.map(t => (
                                    <Button
                                        key={t.id}
                                        variant={selectedTemplate?.id === t.id ? "default" : "outline"}
                                        onClick={() => setSelectedTemplate(t)}
                                        size="sm"
                                    >
                                        {t.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {selectedTemplate && (
                            <div className="space-y-4">
                                <TreatmentWorkflowPreview template={selectedTemplate} />
                                <Button
                                    className="w-full"
                                    onClick={handleAssignPlan}
                                    disabled={assigning}
                                >
                                    {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Assign Treatment Plan
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
