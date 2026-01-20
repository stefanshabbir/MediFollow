import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { getAppointments, getAppointmentRequests } from '@/app/appointments/actions'
import { AppointmentRequestsTable } from '@/components/appointment-requests-table'
import { redirect } from 'next/navigation'
import { PatientAppointmentList } from '@/components/patient-appointment-list'

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
  ).sort((a: any, b: any) => new Date(a.appointment_date + 'T' + a.start_time).getTime() - new Date(b.appointment_date + 'T' + b.start_time).getTime()) || []

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
          <PatientAppointmentList appointments={upcomingAppointments} type="upcoming" />
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
            <PatientAppointmentList appointments={pastAppointments.slice(0, 5)} type="past" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
