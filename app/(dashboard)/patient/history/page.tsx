import { getPatientRecords } from '@/app/actions/records'
import { getAppointments } from '@/app/appointments/actions'
import { MedicalRecordsList } from '@/components/medical-records-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function PatientHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Records
    const { data: allRecords, error: recordsError } = await getPatientRecords(user.id)
    const records = allRecords?.filter((r: any) => r.status === 'finalized') || []

    // Fetch Appointment History
    const { data: appointments, error: appointmentsError } = await getAppointments('patient')

    const pastAppointments = Array.isArray(appointments)
        ? appointments.filter((apt: any) =>
            apt.status === 'completed' ||
            apt.status === 'cancelled' ||
            // Also include confirmed appointments in the past
            (apt.status === 'confirmed' && new Date(apt.appointment_date) < new Date())
        )
        : []

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Medical History</h1>
                <p className="text-muted-foreground mt-1">
                    View your past appointments and medical records
                </p>
            </div>

            {/* Medical Records Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Medical Records</h2>
                {recordsError ? (
                    <div className="text-destructive">Error loading records: {recordsError}</div>
                ) : (
                    <MedicalRecordsList records={records || []} />
                )}
            </div>

            {/* Past Appointments Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Appointment History</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Past Appointments</CardTitle>
                        <CardDescription>
                            Your previous consultations and appointments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pastAppointments.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                No past appointments found.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pastAppointments.map((apt: any) => (
                                    <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="space-y-1 mb-2 sm:mb-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{apt.doctor?.full_name || 'Doctor'}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                    apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(apt.appointment_date).toLocaleDateString()} at {apt.start_time.slice(0, 5)}
                                            </p>
                                            {apt.notes && (
                                                <p className="text-sm text-muted-foreground italic">
                                                    "{apt.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
