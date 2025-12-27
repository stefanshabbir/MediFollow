import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppointmentRequestsTable } from '@/components/appointment-requests-table'
import { getAppointmentRequests } from '@/app/appointments/actions'
import { DoctorsTable } from '@/components/doctors-table'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organisations(*)')
    .eq('id', user?.id)
    .single()

  const { data: doctors } = await supabase
    .from('profiles')
    .select('*')
    .eq('organisation_id', profile?.organisation_id)
    .eq('role', 'doctor')

  const { data: appointmentRequests } = await getAppointmentRequests('admin')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.full_name}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/invite">Invite Doctor</Link>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{profile?.organisations?.name}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Admin: {profile?.full_name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Total Doctors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{doctors?.length || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Active</div>
            <p className="text-sm text-muted-foreground mt-1">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Requests</CardTitle>
          <CardDescription>
            Manage appointment requests across the organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentRequestsTable initialRequests={appointmentRequests || []} role="admin" />
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Doctors</CardTitle>
          <CardDescription>
            Manage your organisation's medical staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DoctorsTable initialDoctors={doctors || []} />
        </CardContent>
      </Card>
    </div>
  )
}
