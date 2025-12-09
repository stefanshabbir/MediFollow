"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getDoctors, getAvailableSlots, createAppointmentRequest, getOrganisations } from "@/app/appointments/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function BookAppointmentPage() {
    const router = useRouter()
    const [doctors, setDoctors] = useState<any[]>([])
    const [organisations, setOrganisations] = useState<any[]>([])
    const [selectedOrg, setSelectedOrg] = useState("")
    const [selectedDoctor, setSelectedDoctor] = useState("")
    const [selectedDate, setSelectedDate] = useState("")
    const [availableSlots, setAvailableSlots] = useState<any[]>([])
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [notes, setNotes] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [slotsLoading, setSlotsLoading] = useState(false)

    // Load initial data
    useEffect(() => {
        async function loadData() {
            try {
                console.log("Client: Fetching doctors and orgs...")
                const [doctorsRes, orgsRes] = await Promise.all([
                    getDoctors(),
                    getOrganisations()
                ])
                console.log("Client: Doctors Response:", doctorsRes)
                console.log("Client: Orgs Response:", orgsRes)

                if (doctorsRes.error) console.error("Error fetching doctors:", doctorsRes.error)
                if (orgsRes.error) console.error("Error fetching organisations:", orgsRes.error)

                if (doctorsRes.data) setDoctors(doctorsRes.data)
                if (orgsRes.data) setOrganisations(orgsRes.data)
            } catch (err) {
                console.error("Failed to load initial data", err)
            }
        }
        loadData()
    }, [])

    // Fetch slots when doctor and date change
    useEffect(() => {
        async function fetchSlots() {
            if (!selectedDoctor || !selectedDate) {
                setAvailableSlots([])
                return
            }

            setSlotsLoading(true)
            setSelectedSlot(null) // Reset selection
            try {
                const result = await getAvailableSlots(selectedDoctor, selectedDate)
                if (result.data) {
                    setAvailableSlots(result.data)
                } else {
                    setAvailableSlots([])
                }
            } catch (err) {
                console.error("Error fetching slots:", err)
            } finally {
                setSlotsLoading(false)
            }
        }
        fetchSlots()
    }, [selectedDoctor, selectedDate])

    // Filter doctors based on selected organisation
    const filteredDoctors = selectedOrg
        ? doctors.filter(d => d.organisation_id === selectedOrg)
        : []

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

        try {
            const result = await createAppointmentRequest(formData)

            if (result.error) {
                setError(result.error)
            } else if (result.success) {
                setSuccess(result.success)
                setTimeout(() => router.push('/patient'), 2000)
            }
        } catch (err) {
            setError("An unexpected error occurred.")
        } finally {
            setIsLoading(false)
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
                        Select a clinic, doctor, date, and time for your appointment
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Clinic Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="clinic">Select Clinic</Label>
                            <select
                                id="clinic"
                                value={selectedOrg}
                                onChange={(e) => {
                                    setSelectedOrg(e.target.value)
                                    setSelectedDoctor("") // Reset doctor when clinic changes
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                required
                            >
                                <option value="">Choose a clinic...</option>
                                {organisations.map((org: any) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Doctor Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="doctor">Select Doctor</Label>
                            <select
                                id="doctor"
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                required
                                disabled={!selectedOrg}
                            >
                                <option value="">
                                    {!selectedOrg ? "Select a clinic first..." : "Choose a doctor..."}
                                </option>
                                {filteredDoctors.map((doc) => (
                                    <option key={doc.id} value={doc.id}>
                                        {doc.full_name || 'Unknown Doctor'}
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
                                disabled={!selectedDoctor}
                            />
                        </div>

                        {/* Time Slot Selection */}
                        {selectedDate && selectedDoctor && (
                            <div className="space-y-2">
                                <Label>Available Time Slots</Label>
                                {slotsLoading ? (
                                    <div className="text-sm text-muted-foreground">Loading slots...</div>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                                        {availableSlots.map((slot, index) => {
                                            const isSelected = selectedSlot?.startTime === slot.startTime
                                            return (
                                                <Button
                                                    key={index}
                                                    type="button"
                                                    variant={isSelected ? "default" : "outline"}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`w-full ${isSelected ? 'ring-2 ring-primary' : ''}`}
                                                >
                                                    {slot.startTime.substring(0, 5)}
                                                </Button>
                                            )
                                        })}
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
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
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
