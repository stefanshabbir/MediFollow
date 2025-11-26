"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getDoctors, getAvailableSlots, createAppointmentRequest } from "@/app/appointments/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function BookAppointmentPage() {
    const router = useRouter()
    const [doctors, setDoctors] = useState<any[]>([])
    const [selectedDoctor, setSelectedDoctor] = useState("")
    const [selectedDate, setSelectedDate] = useState("")
    const [availableSlots, setAvailableSlots] = useState<any[]>([])
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [notes, setNotes] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        async function fetchDoctors() {
            const result = await getDoctors()
            if (result.data) {
                setDoctors(result.data)
            }
        }
        fetchDoctors()
    }, [])

    useEffect(() => {
        async function fetchSlots() {
            if (selectedDoctor && selectedDate) {
                const result = await getAvailableSlots(selectedDoctor, selectedDate)
                if (result.data) {
                    setAvailableSlots(result.data)
                }
            }
        }
        fetchSlots()
    }, [selectedDoctor, selectedDate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        setIsLoading(true)

        if (!selectedDoctor || !selectedDate || !selectedSlot) {
            setError("Please select a doctor, date, and time slot")
            setIsLoading(false)
            return
        }

        const formData = new FormData()
        formData.append('doctorId', selectedDoctor)
        formData.append('appointmentDate', selectedDate)
        formData.append('startTime', selectedSlot.startTime)
        formData.append('endTime', selectedSlot.endTime)
        formData.append('notes', notes)

        const result = await createAppointmentRequest(formData)
        setIsLoading(false)

        if (result.error) {
            setError(result.error)
        } else if (result.success) {
            setSuccess(result.success)
            setTimeout(() => router.push('/patient'), 2000)
        }
    }

    const minDate = new Date().toISOString().split('T')[0]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Request Appointment</h1>
                    <p className="text-muted-foreground mt-1">
                        Submit an appointment request to a doctor
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/patient">Back to Dashboard</Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Appointment Details</CardTitle>
                    <CardDescription>
                        Select a doctor, date, and time for your appointment
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Doctor Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="doctor">Select Doctor</Label>
                            <select
                                id="doctor"
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="">Choose a doctor...</option>
                                {doctors.map((doctor) => (
                                    <option key={doctor.id} value={doctor.id}>
                                        {doctor.full_name} - {doctor.organisations?.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Appointment Date</Label>
                            <Input
                                id="date"
                                type="date"
                                min={minDate}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                            />
                        </div>

                        {/* Time Slot Selection */}
                        {selectedDate && selectedDoctor && (
                            <div className="space-y-2">
                                <Label>Available Time Slots</Label>
                                {availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableSlots.map((slot, index) => (
                                            <Button
                                                key={index}
                                                type="button"
                                                variant={selectedSlot === slot ? "default" : "outline"}
                                                onClick={() => setSelectedSlot(slot)}
                                                className="w-full"
                                            >
                                                {slot.startTime.substring(0, 5)}
                                            </Button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No available slots for this date</p>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any specific concerns or symptoms..."
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                                {success}
                            </div>
                        )}

                        <Button type="submit" disabled={isLoading || !selectedSlot} className="w-full">
                            {isLoading ? "Submitting Request..." : "Submit Appointment Request"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
