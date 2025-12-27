"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAppointments, updateAppointmentStatus, scheduleFollowUp } from '@/app/appointments/actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AppointmentRequestsTable } from '@/components/appointment-requests-table'
import { toast } from "sonner"

interface DashboardClientProps {
    initialAppointments: any[];
    initialRequests: any[];
}

export function DoctorDashboardClient({ initialAppointments, initialRequests }: DashboardClientProps) {
    const [appointments, setAppointments] = useState<any[]>(initialAppointments)
    const [appointmentRequests, setAppointmentRequests] = useState<any[]>(initialRequests)

    const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
    const [followUpDate, setFollowUpDate] = useState("")
    const [followUpTime, setFollowUpTime] = useState("")
    const [followUpNotes, setFollowUpNotes] = useState("")
    const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)

    const handleScheduleFollowUp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAppointment) return

        const formData = new FormData()
        formData.append('previousAppointmentId', selectedAppointment.id)
        formData.append('appointmentDate', followUpDate)
        formData.append('startTime', followUpTime + ":00")
        // Simple 30 min duration for follow-up
        const [hours, minutes] = followUpTime.split(':').map(Number)
        const endDate = new Date()
        endDate.setHours(hours, minutes + 30)
        const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`

        formData.append('endTime', endTime)
        formData.append('notes', followUpNotes)

        const result = await scheduleFollowUp(formData)

        if (result.success) {
            setIsFollowUpOpen(false)
            setFollowUpDate("")
            setFollowUpTime("")
            setFollowUpNotes("")
            // Refresh appointments
            const appointmentsResult = await getAppointments('doctor')
            if (appointmentsResult.data) {
                setAppointments(appointmentsResult.data)
            }
            toast.success(result.success)
        } else {
            toast.error(result.error)
        }
    }

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

            {/* Pending Appointment Requests */}
            <Card>
                <CardHeader>
                    <CardTitle>Appointment Requests</CardTitle>
                    <CardDescription>
                        Review and approve patient appointment requests
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AppointmentRequestsTable initialRequests={appointmentRequests} role="doctor" />
                </CardContent>
            </Card>

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
                                        {(appointment.status === 'completed' || appointment.status === 'confirmed') && (
                                            <Dialog open={isFollowUpOpen && selectedAppointment?.id === appointment.id} onOpenChange={(open) => {
                                                setIsFollowUpOpen(open)
                                                if (open) setSelectedAppointment(appointment)
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="secondary" onClick={() => {
                                                        setSelectedAppointment(appointment)
                                                        setIsFollowUpOpen(true)
                                                    }}>
                                                        Follow Up
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Schedule Follow-up</DialogTitle>
                                                        <DialogDescription>
                                                            Schedule a follow-up appointment for {appointment.patient?.full_name}.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <form onSubmit={handleScheduleFollowUp} className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="date">Date</Label>
                                                            <Input
                                                                id="date"
                                                                type="date"
                                                                required
                                                                min={new Date().toISOString().split('T')[0]}
                                                                value={followUpDate}
                                                                onChange={(e) => setFollowUpDate(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="time">Time</Label>
                                                            <Input
                                                                id="time"
                                                                type="time"
                                                                required
                                                                value={followUpTime}
                                                                onChange={(e) => setFollowUpTime(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="notes">Notes</Label>
                                                            <Textarea
                                                                id="notes"
                                                                placeholder="Reason for follow-up"
                                                                value={followUpNotes}
                                                                onChange={(e) => setFollowUpNotes(e.target.value)}
                                                            />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button type="submit">Schedule</Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${appointment.status === 'confirmed'
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-muted text-muted-foreground'
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
        </div>
    )
}
