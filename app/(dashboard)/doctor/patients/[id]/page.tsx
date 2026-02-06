import { getPatientProfile, getPatientRecords } from '@/app/actions/records'
import { getAppointments } from '@/app/appointments/actions'
import { MedicalRecordUpload } from '@/components/medical-record-upload'
import { MedicalRecordsList } from '@/components/medical-records-list'
import { DoctorAppointmentList } from '@/components/doctor-appointment-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ConsultationNotes } from '@/components/consultation-notes'
import { PatientTreatmentPlanManager } from '@/components/doctor/PatientTreatmentPlanManager'

export default async function PatientDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ appointmentId?: string }> }) {
    const { id } = await params
    const { appointmentId } = await searchParams
    const { data: profile, error: profileError } = await getPatientProfile(id)

    if (profileError || !profile) {
        notFound()
    }

    // Fetch Records
    const { data: records, error: recordsError } = await getPatientRecords(id)

    // Find active draft for this doctor (using current user session implicitly via what getPatientRecords returns, 
    // but getPatientRecords returns ALL records for the patient. 
    // We need to filter for one created by the current doctor with status 'draft'.

    // We need the current doctor's ID to filter safely.
    // Since this is a server component, we can get the session.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check for existing draft
    const activeDraft = records?.find(r =>
        r.status === 'draft' &&
        r.doctor_id === user?.id
    ) || null

    // Fetch Active Treatment Plan
    const { getPatientTreatmentPlans } = await import('@/app/actions/treatment-plan')
    const { data: treatmentPlans } = await getPatientTreatmentPlans(id)
    const activePlan = treatmentPlans?.find((p: any) => p.status === 'active') || null

    // Fetch Appointment History
    const { data: allAppointments, error: appointmentsError } = await getAppointments('doctor')

    const patientAppointments = Array.isArray(allAppointments)
        ? allAppointments.filter((apt: any) => apt.patient_id === id)
        : []

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/doctor/patients">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{profile.full_name}</h1>
                    <p className="text-muted-foreground">Patient Details</p>
                </div>
            </div>

            <ConsultationNotes
                patientId={id}
                initialData={activeDraft ? {
                    id: activeDraft.id,
                    content: activeDraft.content,
                    status: activeDraft.status
                } : null}
                appointmentId={appointmentId}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Upload & Profile */}
                <div className="space-y-6 lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center text-center p-4">
                                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                    <User className="h-12 w-12" />
                                </div>
                                <h3 className="font-semibold text-xl">{profile.full_name}</h3>
                                <p className="text-muted-foreground">{profile.role}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <MedicalRecordUpload patientId={id} />
                </div>

                {/* Right Column: Records & History */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Treatment Plan */}
                    <div className="space-y-2">
                        <PatientTreatmentPlanManager patientId={id} activePlan={activePlan} />
                    </div>

                    {/* Medical Records List */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold tracking-tight">Medical Records</h2>
                        <MedicalRecordsList records={records?.filter(r => r.status === 'finalized') || []} />
                    </div>

                    {/* Appointment History */}
                    <div className="space-y-2 pt-6">
                        <h2 className="text-xl font-semibold tracking-tight">Appointment History</h2>
                        <Card>
                            <CardContent className="p-0">
                                <DoctorAppointmentList appointments={patientAppointments} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
