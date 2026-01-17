"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getDoctors, getAvailableSlots, createAppointmentRequest, getOrganisations } from "@/app/appointments/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"
import { Loader2, User, Clock, CalendarIcon, FilterX } from "lucide-react"

function BookAppointmentForm() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get query params for follow-up
    const preselectedDoctorId = searchParams.get('doctorId')
    const previousAppointmentId = searchParams.get('previousAppointmentId')
    const isFollowUp = !!previousAppointmentId

    // Data State
    const [doctors, setDoctors] = useState<any[]>([])
    const [filteredDoctors, setFilteredDoctors] = useState<any[]>([])
    const [organisations, setOrganisations] = useState<any[]>([])

    // Filter State
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearch = useDebounce(searchQuery, 300)
    const [selectedFilterOrg, setSelectedFilterOrg] = useState<string>("all")
    const [feeRange, setFeeRange] = useState([0, 20000]) // Default range in cents (0 - 20000)
    const debouncedFeeRange = useDebounce(feeRange, 500) // Debounce slider for API calls if we were doing server filtering on slide. 
    // Wait, getDoctors logic is server side. We should fetch doctors based on filters OR fetch all and filter client side?
    // Requirement says "Server-Side Filtering".
    // So we must call getDoctors with filters.

    const [availableOnly, setAvailableOnly] = useState(false)

    // Booking State
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(preselectedDoctorId || null)
    const [selectedDate, setSelectedDate] = useState("")
    const [availableSlots, setAvailableSlots] = useState<any[]>([])
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [notes, setNotes] = useState(isFollowUp ? "Follow-up appointment" : "")

    // Loading State
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [slotsLoading, setSlotsLoading] = useState(false)

    // Load Organisations
    useEffect(() => {
        async function loadOrgs() {
            const { data, error } = await getOrganisations()
            if (data) setOrganisations(data)
            if (error) toast.error("Failed to load clinics")
        }
        loadOrgs()
    }, [])

    // Load Doctors with Server Side Filtering
    useEffect(() => {
        async function fetchDoctors() {
            setIsLoadingDoctors(true)
            try {
                // If preselected doctor (Follow Up), we might want to just fetch that one or lock filters?
                // But for now, let's respect the filters unless overridden?
                // Actually, if follow up, we stick to the doctor.

                const filters: any = {
                    search: debouncedSearch,
                    organisationId: selectedFilterOrg !== "all" ? selectedFilterOrg : undefined,
                    minFee: debouncedFeeRange[0], // Is this array? Yes, Slider value is number[]
                    maxFee: debouncedFeeRange[1],
                    availableOnly: availableOnly
                }

                // If follow up, ignore filters? Or pre-fill filters?
                // Requirement says "Doctor locked for follow-up".
                // If doctor is locked, we should probably just show that doctor.

                const { data, error } = await getDoctors(filters)


                if (error) {
                    toast.error(`Failed to load doctors: ${error}`)
                } else {
                    let docs = data || []
                    if (isFollowUp && preselectedDoctorId) {
                        // Filter manually to ensure we see the locked doctor even if filters don't match?
                        // Or assume implicit?
                        // Better to just filter normally. The user might want to search others but can't select them?
                        // UI disables selection change.
                    }
                    setDoctors(docs)
                }
            } catch (err) {
                console.error(err)
                toast.error("Error loading doctors")
            } finally {
                setIsLoadingDoctors(false)
            }
        }

        // Trigger fetch when any filter changes
        fetchDoctors()
    }, [debouncedSearch, selectedFilterOrg, debouncedFeeRange, availableOnly, isFollowUp, preselectedDoctorId])

    // Load Slots
    useEffect(() => {
        async function fetchSlots() {
            if (!selectedDoctor || !selectedDate) {
                setAvailableSlots([])
                return
            }

            setSlotsLoading(true)
            setSelectedSlot(null)
            try {
                const result = await getAvailableSlots(selectedDoctor, selectedDate)
                setAvailableSlots(result.data || [])
            } catch (err) {
                toast.error("Failed to load slots")
            } finally {
                setSlotsLoading(false)
            }
        }
        fetchSlots()
    }, [selectedDoctor, selectedDate])

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDoctor || !selectedDate || !selectedSlot) return

        setIsSubmitting(true)
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
            if (result.error) toast.error(result.error)
            else {
                toast.success(result.success)
                router.push('/patient')
            }
        } catch {
            toast.error("Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetFilters = () => {
        setSearchQuery("")
        setSelectedFilterOrg("all")
        setFeeRange([0, 20000])
        setAvailableOnly(false)
    }

    const minDate = new Date().toISOString().split('T')[0]

    return (
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            {/* Sidebar Filters */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Book Appointment</h1>
                    <p className="text-muted-foreground text-sm">Find and book your doctor</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Search */}
                        <div className="space-y-2">
                            <Label>Search Doctors</Label>
                            <Input
                                placeholder="Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Organisation */}
                        <div className="space-y-2">
                            <Label>Medical Center</Label>
                            <Select value={selectedFilterOrg} onValueChange={setSelectedFilterOrg}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Clinics" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Clinics</SelectItem>
                                    {organisations.map(org => (
                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fees */}
                        <div className="space-y-2">
                            <Label>Consultation Fee (LKR)</Label>
                            <Slider
                                value={[feeRange[0]]} // Slider expects array. 
                                // Wait, simple slider? Shadcn slider supports range (2 values) or single.
                                // If I pass [min, max], it's a range slider.
                                // Let's simplify to max fee? Or range?
                                // "Filter by the fee_cents column".
                                // Typically "Max Price" is what uses want.
                                // But let's support min/max.
                                // However, passing [val] implies single thumb. 
                                // Updating feeRange state which is [0, 20000].
                                // If I want just max fee:
                                min={0}
                                max={20000}
                                step={500}
                                onValueChange={(val) => setFeeRange([feeRange[0], val[0]])} // Only updating max?
                            // Let's implement MAX FEE filter for simplicity and UX.
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Max: {(feeRange[1] / 100).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Availability */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="available"
                                checked={availableOnly}
                                onCheckedChange={(c) => setAvailableOnly(!!c)}
                            />
                            <Label htmlFor="available">Available Soon</Label>
                        </div>

                        <Button variant="outline" className="w-full" onClick={resetFilters}>
                            Reset Filters
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Doctor List */}
                {isLoadingDoctors ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>
                ) : doctors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/10 text-center">
                        <FilterX className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No doctors found</h3>
                        <p className="text-muted-foreground mb-4">Try adjusting your filters to see more results.</p>
                        <Button onClick={resetFilters}>Clear All Filters</Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {doctors.map(doctor => (
                            <Card
                                key={doctor.id}
                                className={`cursor-pointer transition-all hover:border-primary ${selectedDoctor === doctor.id ? 'border-primary ring-1 ring-primary' : ''}`}
                                onClick={() => {
                                    if (isFollowUp && preselectedDoctorId && preselectedDoctorId !== doctor.id) return
                                    setSelectedDoctor(doctor.id)
                                    // Also auto-select empty date if needed? No.
                                }}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{doctor.full_name}</CardTitle>
                                        {doctor.has_records && (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                                History
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription>
                                        {organisations.find(o => o.id === doctor.organisation_id)?.name || "Clinic"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="flex items-center text-muted-foreground">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>General Practitioner</span> {/* Placeholder for specialty if not in schema yet */}
                                    </div>
                                    <div className="font-semibold">
                                        {(doctor.fee_cents / 100).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        variant={selectedDoctor === doctor.id ? "default" : "secondary"}
                                        className="w-full"
                                        disabled={isFollowUp && preselectedDoctorId !== doctor.id}
                                    >
                                        {selectedDoctor === doctor.id ? "Selected" : "Select Doctor"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Booking Form Area - Only show if doctor selected */}
                {selectedDoctor && (
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader>
                            <CardTitle>Schedule Appointment</CardTitle>
                            <CardDescription>
                                Booking with {doctors.find(d => d.id === selectedDoctor)?.full_name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        min={minDate}
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Time Slot</Label>
                                    {!selectedDate ? (
                                        <div className="text-sm text-muted-foreground p-2 border rounded bg-muted/20">Select a date first</div>
                                    ) : slotsLoading ? (
                                        <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking availability...</div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="text-sm text-destructive p-2 border border-destructive/20 rounded bg-destructive/10">No slots available</div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
                                            {availableSlots.map((slot, i) => (
                                                <Button
                                                    key={i}
                                                    variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setSelectedSlot(slot)}
                                                    type="button"
                                                >
                                                    {slot.startTime.substring(0, 5)}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input
                                    placeholder="Reason for visit..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleBooking}
                                disabled={isSubmitting || !selectedSlot}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...
                                    </>
                                ) : (
                                    "Confirm Appointment Request"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default function BookAppointmentPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <BookAppointmentForm />
        </Suspense>
    )
}
