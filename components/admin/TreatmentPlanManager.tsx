"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Trash2, ChevronRight, FileText, ListChecks } from "lucide-react"
import {
    createDiagnosis,
    deleteDiagnosis,
    createTemplate,
    deleteTemplate,
    addTemplateStep,
    deleteTemplateStep,
    getTemplatesForDiagnosis,
} from "@/app/actions/admin-treatment-plans"

type Diagnosis = {
    id: string
    name: string
    description: string | null
}

type TemplateStep = {
    id: string
    step_order: number
    title: string
    appointment_type: string
    suggested_time_gap: string | null
}

type Template = {
    id: string
    name: string
    description: string | null
    steps: TemplateStep[]
}

interface TreatmentPlanManagerProps {
    initialDiagnoses: Diagnosis[]
}

export function TreatmentPlanManager({ initialDiagnoses }: TreatmentPlanManagerProps) {
    const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(initialDiagnoses)
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null)
    const [templates, setTemplates] = useState<Template[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

    // Dialog states
    const [newDiagnosisOpen, setNewDiagnosisOpen] = useState(false)
    const [newTemplateOpen, setNewTemplateOpen] = useState(false)
    const [newStepOpen, setNewStepOpen] = useState(false)

    // Form states
    const [diagnosisName, setDiagnosisName] = useState("")
    const [diagnosisDesc, setDiagnosisDesc] = useState("")
    const [templateName, setTemplateName] = useState("")
    const [templateDesc, setTemplateDesc] = useState("")
    const [stepTitle, setStepTitle] = useState("")
    const [stepType, setStepType] = useState("")
    const [stepGap, setStepGap] = useState("")

    const handleSelectDiagnosis = async (diagnosis: Diagnosis) => {
        setSelectedDiagnosis(diagnosis)
        setSelectedTemplate(null)
        const result = await getTemplatesForDiagnosis(diagnosis.id)
        if (result.data) {
            setTemplates(result.data)
        }
    }

    const handleCreateDiagnosis = async () => {
        if (!diagnosisName.trim()) return
        const result = await createDiagnosis({ name: diagnosisName, description: diagnosisDesc })
        if (result.success && result.data) {
            setDiagnoses([...diagnoses, result.data])
            setNewDiagnosisOpen(false)
            setDiagnosisName("")
            setDiagnosisDesc("")
            toast.success("Diagnosis created")
        } else {
            toast.error(result.error)
        }
    }

    const handleDeleteDiagnosis = async (id: string) => {
        const result = await deleteDiagnosis(id)
        if (result.success) {
            setDiagnoses(diagnoses.filter(d => d.id !== id))
            if (selectedDiagnosis?.id === id) {
                setSelectedDiagnosis(null)
                setTemplates([])
            }
            toast.success("Diagnosis deleted")
        } else {
            toast.error(result.error)
        }
    }

    const handleCreateTemplate = async () => {
        if (!selectedDiagnosis || !templateName.trim()) return
        const result = await createTemplate({
            diagnosis_id: selectedDiagnosis.id,
            name: templateName,
            description: templateDesc
        })
        if (result.success && result.data) {
            setTemplates([...templates, { ...result.data, steps: [] }])
            setNewTemplateOpen(false)
            setTemplateName("")
            setTemplateDesc("")
            toast.success("Template created")
        } else {
            toast.error(result.error)
        }
    }

    const handleDeleteTemplate = async (id: string) => {
        const result = await deleteTemplate(id)
        if (result.success) {
            setTemplates(templates.filter(t => t.id !== id))
            if (selectedTemplate?.id === id) setSelectedTemplate(null)
            toast.success("Template deleted")
        } else {
            toast.error(result.error)
        }
    }

    const handleAddStep = async () => {
        if (!selectedTemplate || !stepTitle.trim() || !stepType.trim()) return
        const nextOrder = (selectedTemplate.steps.length || 0) + 1
        const result = await addTemplateStep({
            template_id: selectedTemplate.id,
            step_order: nextOrder,
            title: stepTitle,
            appointment_type: stepType,
            suggested_time_gap: stepGap || undefined
        })
        if (result.success && result.data) {
            const updatedTemplate = {
                ...selectedTemplate,
                steps: [...selectedTemplate.steps, result.data]
            }
            setSelectedTemplate(updatedTemplate)
            setTemplates(templates.map(t => t.id === selectedTemplate.id ? updatedTemplate : t))
            setNewStepOpen(false)
            setStepTitle("")
            setStepType("")
            setStepGap("")
            toast.success("Step added")
        } else {
            toast.error(result.error)
        }
    }

    const handleDeleteStep = async (stepId: string) => {
        if (!selectedTemplate) return
        const result = await deleteTemplateStep(stepId)
        if (result.success) {
            const updatedSteps = selectedTemplate.steps.filter(s => s.id !== stepId)
            const updatedTemplate = { ...selectedTemplate, steps: updatedSteps }
            setSelectedTemplate(updatedTemplate)
            setTemplates(templates.map(t => t.id === selectedTemplate.id ? updatedTemplate : t))
            toast.success("Step deleted")
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Column 1: Diagnoses */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle className="text-lg">Diagnoses</CardTitle>
                        <CardDescription>Conditions that can be assigned</CardDescription>
                    </div>
                    <Dialog open={newDiagnosisOpen} onOpenChange={setNewDiagnosisOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Diagnosis</DialogTitle>
                                <DialogDescription>Create a new diagnosis condition.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={diagnosisName} onChange={e => setDiagnosisName(e.target.value)} placeholder="e.g., Type 2 Diabetes" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Optional)</Label>
                                    <Textarea value={diagnosisDesc} onChange={e => setDiagnosisDesc(e.target.value)} placeholder="Brief description..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateDiagnosis}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                    {diagnoses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No diagnoses yet.</p>}
                    {diagnoses.map(d => (
                        <div
                            key={d.id}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedDiagnosis?.id === d.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                            onClick={() => handleSelectDiagnosis(d)}
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{d.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDeleteDiagnosis(d.id) }}>
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Column 2: Templates for Selected Diagnosis */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle className="text-lg">Templates</CardTitle>
                        <CardDescription>{selectedDiagnosis ? `For: ${selectedDiagnosis.name}` : 'Select a diagnosis'}</CardDescription>
                    </div>
                    <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" disabled={!selectedDiagnosis}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Template</DialogTitle>
                                <DialogDescription>Create a treatment workflow template for {selectedDiagnosis?.name}.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Template Name</Label>
                                    <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g., Standard Protocol" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Optional)</Label>
                                    <Textarea value={templateDesc} onChange={e => setTemplateDesc(e.target.value)} placeholder="Brief description..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateTemplate}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                    {!selectedDiagnosis && <p className="text-sm text-muted-foreground text-center py-4">Select a diagnosis first.</p>}
                    {selectedDiagnosis && templates.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No templates for this diagnosis.</p>}
                    {templates.map(t => (
                        <div
                            key={t.id}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedTemplate?.id === t.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                            onClick={() => setSelectedTemplate(t)}
                        >
                            <div className="flex items-center gap-2">
                                <ListChecks className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <span className="font-medium text-sm">{t.name}</span>
                                    <p className="text-xs text-muted-foreground">{t.steps.length} steps</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id) }}>
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Column 3: Steps for Selected Template */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle className="text-lg">Workflow Steps</CardTitle>
                        <CardDescription>{selectedTemplate ? `For: ${selectedTemplate.name}` : 'Select a template'}</CardDescription>
                    </div>
                    <Dialog open={newStepOpen} onOpenChange={setNewStepOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" disabled={!selectedTemplate}><Plus className="h-4 w-4 mr-1" /> Add Step</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Step</DialogTitle>
                                <DialogDescription>Add a new step to the {selectedTemplate?.name} workflow.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Step Title</Label>
                                    <Input value={stepTitle} onChange={e => setStepTitle(e.target.value)} placeholder="e.g., Initial Consultation" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Appointment Type</Label>
                                    <Input value={stepType} onChange={e => setStepType(e.target.value)} placeholder="e.g., Consultation, Checkup, Lab Test" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Suggested Time Gap (Optional)</Label>
                                    <Input value={stepGap} onChange={e => setStepGap(e.target.value)} placeholder="e.g., 7 days, 2 weeks" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddStep}>Add Step</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                    {!selectedTemplate && <p className="text-sm text-muted-foreground text-center py-4">Select a template first.</p>}
                    {selectedTemplate && selectedTemplate.steps.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No steps in this template.</p>}
                    {selectedTemplate?.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-start justify-between p-3 rounded-lg border bg-muted/30">
                            <div className="flex items-start gap-3">
                                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                    {step.step_order}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{step.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="text-xs">{step.appointment_type}</Badge>
                                        {step.suggested_time_gap && <span className="text-xs text-muted-foreground">Wait: {step.suggested_time_gap}</span>}
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteStep(step.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
