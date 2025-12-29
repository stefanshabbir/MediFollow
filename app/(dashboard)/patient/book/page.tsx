"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getDoctors, getAvailableSlots, createAppointmentRequest, getOrganisations } from "@/app/appointments/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"

function BookAppointmentForm() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get query params for follow-up
    const preselectedDoctorId = searchParams.get('doctorId')
    const previousAppointmentId = searchParams.get('previousAppointmentId')
    const isFollowUp = !!previousAppointmentId

    const [doctors, setDoctors] = useState<any[]>([])
    const [organisations, setOrganisations] = useState<any[]>([])

    // State
    const [selectedOrg, setSelectedOrg] = useState("")
    const [selectedDoctor, setSelectedDoctor] = useState(preselectedDoctorId || "")
    const [selectedDate, setSelectedDate] = useState("")
    const [availableSlots, setAvailableSlots] = useState<any[]>([])
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [notes, setNotes] = useState(isFollowUp ? "Follow-up appointment" : "")
    const [isLoading, setIsLoading] = useState(false)
    const [slotsLoading, setSlotsLoading] = useState(false)

    // Load initial data
    useEffect(() => {
        async function loadData() {
            try {
                const [doctorsRes, orgsRes] = await Promise.all([
                    getDoctors(),
                    getOrganisations()
                ])

                if (doctorsRes.error) {
                    toast.error("Error fetching doctors")
                } else {
                    setDoctors(doctorsRes.data || [])

                    // If preselected doctor, find their org to select it automatically
                    if (preselectedDoctorId && doctorsRes.data) {
                        const doctor = doctorsRes.data.find((d: any) => d.id === preselectedDoctorId)
                        if (doctor) {
                            setSelectedOrg(doctor.organisation_id)
                        }
                    }
                }

                if (orgsRes.error) {
                    toast.error("Error fetching organisations")
                } else {
                    setOrganisations(orgsRes.data || [])
                }
            } catch (err) {
                console.error("Failed to load initial data", err)
                toast.error("Failed to load initial data")
            }
        }
        loadData()
    }, [preselectedDoctorId])

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
                toast.error("Failed to load available slots")
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
        setIsLoading(true)

        if (!selectedDoctor || !selectedDate || !selectedSlot) {
            toast.error("Please select a doctor, date, and time slot")
            setIsLoading(false)
            return
        }

        const formData = new FormData()
        formData.append('doctorId', selectedDoctor)
        formData.append('appointmentDate', selectedDate)
        formData.append('startTime', selectedSlot.startTime)
        formData.append('endTime', selectedSlot.endTime)
        formData.append('notes', notes)
        if (previousAppointmentId) {
            formData.append('previousAppointmentId', previousAppointmentId)
        }

        try {
            const result = await createAppointmentRequest(formData)

            if (result.error) {
                toast.error(result.error)
            } else if (result.success) {
                toast.success(result.success)
                setTimeout(() => router.push('/patient'), 2000)
            }
        } catch (err) {
            toast.error("An unexpected error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    const minDate = new Date().toISOString().split('T')[0]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {isFollowUp ? "Book Follow-up" : "Request Appointment"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isFollowUp
                            ? "Schedule a follow-up visit with your doctor"
                            : "Submit an appointment request to a doctor"}
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
                                className="flex h-11 w-full rounded-md border-2 border-border bg-background text-foreground px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                className="flex h-11 w-full rounded-md border-2 border-border bg-background text-foreground px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                                disabled={!selectedOrg || (isFollowUp && !!preselectedDoctorId)}
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
                            {isFollowUp && preselectedDoctorId && (
                                <p className="text-xs text-muted-foreground">
                                    Doctor locked for follow-up appointment
                                </p>
                            )}
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
                                className="flex min-h-[100px] w-full rounded-md border-2 border-border bg-background text-foreground px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <Button type="submit" disabled={isLoading || !selectedSlot} className="w-full" size="lg">
                            {isLoading ? "Submitting Request..." : (isFollowUp ? "Schedule Follow-up" : "Submit Appointment Request")}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function BookAppointmentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookAppointmentForm />
        </Suspense>
    )
}
