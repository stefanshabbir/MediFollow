import { getPatientRecords } from '@/app/actions/records'
import { getAppointments } from '@/app/appointments/actions'
import { MedicalRecordsList } from '@/components/medical-records-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button, buttonVariants } from '@/components/ui/button' // For clear filters (Link?) or button
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PatientHistoryPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Filter Params
    const startDate = typeof searchParams.startDate === 'string' ? searchParams.startDate : undefined
    const endDate = typeof searchParams.endDate === 'string' ? searchParams.endDate : undefined
    const status = typeof searchParams.status === 'string' ? searchParams.status : undefined
    const doctorName = typeof searchParams.doctorName === 'string' ? searchParams.doctorName : undefined

    // Fetch Records
    const { data: allRecords, error: recordsError } = await getPatientRecords(user.id)
    const records = allRecords?.filter((r: any) => r.status === 'finalized') || []

    // Fetch Appointment History
    const { data: appointments, error: appointmentsError } = await getAppointments('patient', {
        startDate,
        endDate,
        status,
        doctorName
    })

    // Filter "Past" Logic?
    // Requirement says "Appointment History page".
    // Usually history means "Completed, Cancelled, or Past Confirmed".
    // If I apply server filters, I get what fits the query.
    // If user explicitly filters for "Upcoming", should I show it?
    // The previous logic was:
    // const pastAppointments = appointments.filter(apt => completed || cancelled || (confirmed && past))
    // If I use the new `getAppointments`, I get everything matching filters.
    // If NO filters are active, I should probably apply the "Past" logic default?
    // But if user filters by date, they might want to see specific range regardless of status.

    // I will preserve the "Past" logic ONLY if no specific status/date filter is applied?
    // Actually, "History" implies past. 
    // But if I add a status filter "Confirmed", do I show future confirmed?
    // Let's assume the user can filter for anything.
    // But the page title is "Medical History".
    // I'll stick to showing what the AP call returns, but maybe sort descending?
    // The API orders ascending.
    // I should probably reverse it for history (newest first).

    const displayAppointments = (appointments || []).sort((a: any, b: any) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())

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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-semibold tracking-tight">Appointment History</h2>

                    {/* Filters Form - Client Logic via Server Actions/Links is easier with Form or just simple Links. 
                        We can use a simple generic client form component or just query params links.
                        Since this is a Server Component, adding interactivity requires a Client Component for the filter bar.
                        I'll use a simple form that submits GET to this page.
                     */}
                    <form className="flex flex-wrap gap-2 items-end">
                        <div className="space-y-1">
                            <span className="text-xs font-medium">From</span>
                            <Input
                                type="date"
                                name="startDate"
                                defaultValue={startDate}
                                className="h-8 w-[140px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium">To</span>
                            <Input
                                type="date"
                                name="endDate"
                                defaultValue={endDate}
                                className="h-8 w-[140px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium">Doctor</span>
                            <Input
                                placeholder="Doctor Name"
                                name="doctorName"
                                defaultValue={doctorName}
                                className="h-8 w-[140px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium">Status</span>
                            <select
                                name="status"
                                defaultValue={status || ""}
                                className="h-8 rounded-md border border-border bg-background text-foreground text-sm px-2 w-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">All Statuses</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="confirmed">Confirmed</option>
                            </select>
                        </div>
                        <Button type="submit" size="sm" variant="secondary">Filter</Button>
                        <Link href="/patient/history" className={buttonVariants({ size: "sm", variant: "ghost" })}>
                            Reset
                        </Link>
                    </form>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Appointments</CardTitle>
                        <CardDescription>
                            {displayAppointments.length} result(s) found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {displayAppointments.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                No appointments found matching filters.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {displayAppointments.map((apt: any) => (
                                    <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="space-y-1 mb-2 sm:mb-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{apt.doctor?.full_name || 'Doctor'}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${apt.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' :
                                                    apt.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100' :
                                                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100'
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
