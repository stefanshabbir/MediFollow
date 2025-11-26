"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAppointments, updateAppointmentStatus } from '@/app/appointments/actions'

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const appointmentsResult = await getAppointments('doctor')
      if (appointmentsResult.data) {
        setAppointments(appointmentsResult.data)
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    const result = await updateAppointmentStatus(appointmentId, status)
    if (result.success) {
      // Refresh appointments
      const appointmentsResult = await getAppointments('doctor')
      if (appointmentsResult.data) {
        setAppointments(appointmentsResult.data)
      }
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter((apt: any) =>
    apt.appointment_date === today && apt.status !== 'cancelled'
  )
  const upcomingAppointments = appointments.filter((apt: any) =>
    new Date(apt.appointment_date) > new Date() && apt.status !== 'cancelled'
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Doctor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your appointments and patients
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/doctor/schedule">Manage Schedule</Link>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Today's Appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todayAppointments.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {todayAppointments.length === 0 ? 'No appointments today' : 'Scheduled for today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Upcoming Appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{upcomingAppointments.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Future appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Total Patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {new Set(appointments.map((apt: any) => apt.patient_id)).size}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Unique patients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
          <CardDescription>
            Your scheduled consultations for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAppointments.length > 0 ? (
            <div className="space-y-4">
              {todayAppointments.map((appointment: any) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-foreground">
                      {appointment.patient?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                    </p>
                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Note: {appointment.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {appointment.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${appointment.status === 'confirmed'
                      ? 'bg-primary/10 text-primary'
                      : appointment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No appointments scheduled for today. Your schedule is clear.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              Future scheduled consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.slice(0, 5).map((appointment: any) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {appointment.patient?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} at {appointment.start_time.substring(0, 5)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${appointment.status === 'confirmed'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
