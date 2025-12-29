import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import Link from 'next/link'
import { getAppointments, getAppointmentRequests } from '@/app/appointments/actions'
import { AppointmentRequestsTable } from '@/components/appointment-requests-table'
import { CancelAppointmentButton } from '@/components/cancel-appointment-button'
import { redirect } from 'next/navigation'

export default async function PatientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: appointments } = await getAppointments('patient')
  const { data: appointmentRequests } = await getAppointmentRequests('patient')

  console.log('server: appointmentRequests', appointmentRequests)

  const upcomingAppointments = appointments?.filter((apt: any) =>
    new Date(apt.appointment_date) >= new Date() && apt.status !== 'cancelled'
  ) || []

  const pastAppointments = appointments?.filter((apt: any) =>
    new Date(apt.appointment_date) < new Date() || apt.status === 'completed'
  ) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Health</h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {profile?.full_name}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/patient/book">Request Appointment</Link>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Upcoming Appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{upcomingAppointments.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {upcomingAppointments.length === 0 ? 'No upcoming appointments' : 'Scheduled'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Past Visits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pastAppointments.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Account Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Active</div>
            <p className="text-sm text-muted-foreground mt-1">
              Your account is active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Requests</CardTitle>
          <CardDescription>
            Status of your appointment requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentRequestsTable initialRequests={appointmentRequests || []} role="patient" />
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            Your scheduled consultations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment: any) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      Dr. {appointment.doctor?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} at {appointment.start_time.substring(0, 5)}
                    </p>
                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Note: {appointment.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={appointment.status as any} />
                    <CancelAppointmentButton id={appointment.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You have no upcoming appointments. Book your first appointment to get started.
              </p>
              <Button asChild variant="outline">
                <Link href="/patient/book">Book Appointment</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
            <CardDescription>
              Your appointment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastAppointments.slice(0, 5).map((appointment: any) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      Dr. {appointment.doctor?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-1 text-xs font-semibold">
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/patient/book?doctorId=${appointment.doctor_id}&previousAppointmentId=${appointment.id}`}>
                        Book Follow-up
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
