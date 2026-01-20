import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPatientTreatmentPlans } from '@/app/actions/treatment-plan'
import { createClient } from '@/utils/supabase/server'
import { TreatmentWorkflowPreview } from '@/components/doctor/TreatmentWorkflowPreview'
import { Activity, CalendarDays } from 'lucide-react'

export default async function PatientTreatmentPlanPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="p-8 text-center">
                <p>Please log in to view your treatment plan.</p>
            </div>
        )
    }

    const { data: plans } = await getPatientTreatmentPlans(user.id)
    const activePlan = plans?.find((p: any) => p.status === 'active')

    if (!activePlan) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Treatment Plan</h1>
                        <p className="text-muted-foreground">Your personalized care journey</p>
                    </div>
                </div>

                <Card className="border-dashed">
                    <CardHeader className="text-center pb-10 pt-10">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Activity className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <CardTitle>No Active Treatment Plan</CardTitle>
                        <CardDescription className="max-w-md mx-auto mt-2">
                            You don't have an active treatment plan assigned yet.
                            Your doctor will create a personalized plan for you after your diagnosis.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Treatment Plan</h1>
                    <p className="text-muted-foreground">Your personalized care journey</p>
                </div>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-sm">Active Plan</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Diagnosis: {activePlan.diagnosis?.name}
                            </CardTitle>
                            <CardDescription>
                                {activePlan.diagnosis?.description || "Treatment protocol assigned by your doctor."}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {activePlan.template && activePlan.template.steps && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <CalendarDays className="h-5 w-5" />
                                Your Protocol Timeline
                            </h2>
                            <TreatmentWorkflowPreview
                                template={{
                                    ...activePlan.template,
                                    steps: activePlan.template.steps as any
                                }}
                                planAppointments={activePlan.plan_appointments}
                                isPatient={true}
                            />
                        </div>
                    )}
                </div>

                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Started On</span>
                                <span className="font-medium">{new Date(activePlan.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Status</span>
                                <span className="capitalize">{activePlan.status}</span>
                            </div>
                            {/* In future we can link to the assigned doctor */}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
