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

export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: profile, error: profileError } = await getPatientProfile(id)

    if (profileError || !profile) {
        notFound()
    }

    // Fetch Records
    const { data: records, error: recordsError } = await getPatientRecords(id)

    // Fetch Appointment History
    // We need to fetch ALL appointments and filter for this patient and this doctor
    // Optimized: In a real app we'd have a specific query. For now we reuse getAppointments('doctor') which filters by current doctor, then filter by patient.
    // Actually getAppointments('doctor') is per current user.
    // Wait, getAppointments('doctor') loads appointments where doctor_id = me.
    // So we can just filter that list by patient_id = id.
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
                    {/* Medical Records List */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold tracking-tight">Medical Records</h2>
                        <MedicalRecordsList records={records || []} />
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
