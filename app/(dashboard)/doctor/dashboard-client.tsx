"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { getAppointments, updateAppointmentStatus, scheduleFollowUp, initiateAppointmentCheckout } from '@/app/appointments/actions'
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
    // const [appointmentRequests, setAppointmentRequests] = useState<any[]>(initialRequests) // Removed requests table

    const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
    const [followUpDate, setFollowUpDate] = useState("")
    const [followUpTime, setFollowUpTime] = useState("")
    const [followUpNotes, setFollowUpNotes] = useState("")
    const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)

    // Consultation State
    const [isConsultationOpen, setIsConsultationOpen] = useState(false)
    const [consultationNotes, setConsultationNotes] = useState("")
    const [diagnosis, setDiagnosis] = useState("")

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

    const handleSendToCheckout = async (appointmentId: string, regenerate?: boolean) => {
        const result = await initiateAppointmentCheckout(appointmentId, { regenerate })
        if (result.error) {
            toast.error(result.error)
            return
        }

        const appointmentsResult = await getAppointments('doctor')
        if (appointmentsResult.data) {
            setAppointments(appointmentsResult.data)
        }

        toast.success('Payment checkout created. Patient will be prompted to pay.')
    }

    // New: Handle Consultation Submission
    const handleSubmitConsultation = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAppointment) return

        const formData = new FormData()
        formData.append('appointmentId', selectedAppointment.id)
        formData.append('consultationNotes', consultationNotes)
        formData.append('diagnosis', diagnosis)

        // Assuming import is available, otherwise we need to add it to imports
        // We need to import submitConsultation from actions
        const { submitConsultation } = await import('@/app/appointments/actions')

        const result = await submitConsultation(formData)

        if (result.success) {
            setIsConsultationOpen(false)
            setConsultationNotes("")
            setDiagnosis("")
            toast.success(result.success)
            // Refresh appointments
            const appointmentsResult = await getAppointments('doctor')
            if (appointmentsResult.data) {
                setAppointments(appointmentsResult.data)
            }
        } else {
            toast.error(result.error)
        }
    }


    const today = new Date().toISOString().split('T')[0]
    const todayAppointments = appointments.filter((apt: any) =>
        apt.appointment_date === today && apt.status !== 'cancelled' // Hide cancelled
    )

    // Fix logic for upcoming: Date > Today OR (Date == Today AND Time > Now)
    // But simple > new Date() might hide today's later appointments if not careful with time
    // Let's rely on standard comparison:
    const upcomingAppointments = appointments.filter((apt: any) => {
        const aptDate = new Date(apt.appointment_date)
        aptDate.setHours(0, 0, 0, 0)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        // Future dates only for "Upcoming" card stats?
        return aptDate > now && apt.status !== 'cancelled'
    })

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
                <div className="flex gap-2">
                    <Link href="/doctor/sessions" className={buttonVariants({ variant: "outline" })}>
                        Clinical Sessions
                    </Link>
                    <Link href="/doctor/schedule" className={buttonVariants({ variant: "outline" })}>
                        Recurring Schedule
                    </Link>
                </div>
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

            {/* REMOVED Pending Appointment Requests Table as per user request */}

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
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/doctor/patients/${appointment.patient_id}?appointmentId=${appointment.id}`}
                                                className="font-semibold text-foreground hover:underline"
                                            >
                                                {appointment.patient?.full_name}
                                            </Link>
                                            {/* Paid Badge Logic */}
                                            {appointment.payment_status === 'paid' && (
                                                <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    PAID
                                                </span>
                                            )}
                                        </div>

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
                                        {/* Start Consultation Button */}
                                        {(appointment.status === 'confirmed' || appointment.status === 'awaiting_payment') && (
                                            <Dialog open={isConsultationOpen && selectedAppointment?.id === appointment.id} onOpenChange={(open) => {
                                                setIsConsultationOpen(open)
                                                if (open) {
                                                    setSelectedAppointment(appointment)
                                                    setConsultationNotes(appointment.consultation_notes || "")
                                                    setDiagnosis(appointment.diagnosis || "")
                                                }
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" onClick={() => {
                                                        setSelectedAppointment(appointment)
                                                        setIsConsultationOpen(true)
                                                    }}>
                                                        Start Consultation
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Consultation: {appointment.patient?.full_name}</DialogTitle>
                                                        <DialogDescription>
                                                            Record clinical notes and diagnosis.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <form onSubmit={handleSubmitConsultation} className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="diagnosis">Diagnosis</Label>
                                                            <Input
                                                                id="diagnosis"
                                                                placeholder="Primary Diagnosis"
                                                                value={diagnosis}
                                                                onChange={(e) => setDiagnosis(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="notes">Clinical Notes</Label>
                                                            <Textarea
                                                                id="notes"
                                                                placeholder="Detailed consultation notes..."
                                                                className="min-h-[150px]"
                                                                value={consultationNotes}
                                                                onChange={(e) => setConsultationNotes(e.target.value)}
                                                            />
                                                        </div>
                                                        <DialogFooter className="gap-2 sm:justify-between">
                                                            <Button type="button" variant="outline" onClick={() => setIsConsultationOpen(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button type="submit">
                                                                Complete Consultation
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        )}

                                        {appointment.status === 'confirmed' && appointment.payment_status !== 'paid' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleSendToCheckout(appointment.id)}
                                            >
                                                Payment
                                            </Button>
                                        )}
                                        {appointment.status === 'awaiting_payment' && appointment.payment_status !== 'paid' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleSendToCheckout(appointment.id, true)}
                                            >
                                                Resend
                                            </Button>
                                        )}
                                        {appointment.status === 'completed' && (
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
                                        <StatusBadge status={appointment.status as any} />
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
