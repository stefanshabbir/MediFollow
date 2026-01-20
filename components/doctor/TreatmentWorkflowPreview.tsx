"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarClock, ArrowDown, CheckCircle2, Clock, Calendar } from "lucide-react"
import { type TreatmentTemplate, type TreatmentTemplateStep, type TreatmentPlanAppointment } from "@/app/actions/treatment-plan"
import Link from "next/link"

interface TreatmentWorkflowPreviewProps {
    template: TreatmentTemplate & { steps: TreatmentTemplateStep[] }
    planAppointments?: TreatmentPlanAppointment[]
    isPatient?: boolean
    doctorId?: string
}

export function TreatmentWorkflowPreview({ template, planAppointments, isPatient, doctorId }: TreatmentWorkflowPreviewProps) {
    return (
        <Card className="mt-4 border-l-4 border-l-primary/50">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    Recommended Workflow: {template.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardHeader>
            <CardContent>
                <div className="relative pl-6 border-l-2 border-muted space-y-6">
                    {template.steps.map((step, index) => {
                        const appointment = planAppointments?.find(pa => pa.step_id === step.id)
                        const status = appointment?.status || 'pending'

                        return (
                            <div key={step.id} className="relative">
                                {/* Dot on timeline */}
                                <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 bg-background flex items-center justify-center
                                    ${status === 'completed' ? 'border-primary text-primary' : 'border-muted-foreground'}`
                                }>
                                    {status === 'completed' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">Step {step.step_order}: {step.title}</span>
                                            {status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                        </div>
                                        <Badge variant={status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                                            {status}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 border">
                                            {step.appointment_type}
                                        </Badge>

                                        {isPatient && status === 'pending' && (
                                            <Button size="sm" asChild className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                                                <Link href={`/patient/book?type=${step.appointment_type}&reason=${encodeURIComponent(step.title)}&stepId=${step.id}${doctorId ? `&doctorId=${doctorId}` : ''}`}>
                                                    <Calendar className="mr-2 h-3 w-3" />
                                                    Book Appointment
                                                </Link>
                                            </Button>
                                        )}
                                        {/* If scheduled, show date maybe? Need to fetch appt details for that. 
                                            For now, just showing status is good. */}
                                    </div>

                                    {step.suggested_time_gap && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <ArrowDown className="h-3 w-3" />
                                            Wait {step.suggested_time_gap}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
