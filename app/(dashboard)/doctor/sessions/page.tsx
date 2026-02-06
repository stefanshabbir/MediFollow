'use client'

import { useState, useEffect } from 'react'
import { getDoctorSessions, createSession, cancelSession } from '@/app/sessions/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Loader2, Plus, Calendar, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function DoctorSessionsPage() {
    const [sessions, setSessions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form State
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [label, setLabel] = useState('')
    const [slotDuration, setSlotDuration] = useState('15')

    const loadSessions = async () => {
        setIsLoading(true)
        const result = await getDoctorSessions(undefined, new Date().toISOString().split('T')[0]) // From today
        if (result.data) {
            setSessions(result.data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        loadSessions()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)

        const formData = new FormData()
        formData.append('date', date)
        formData.append('startTime', startTime)
        formData.append('endTime', endTime)
        formData.append('label', label)
        formData.append('slotDuration', slotDuration)

        try {
            const result = await createSession(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Session created successfully')
                setIsDialogOpen(false)
                // Reset form
                setDate('')
                setStartTime('')
                setEndTime('')
                setLabel('')
                loadSessions()
            }
        } catch (err) {
            toast.error('Failed to create session')
        } finally {
            setIsCreating(false)
        }
    }

    const handleCancel = async (sessionId: string) => {
        if (!confirm('Are you sure you want to cancel this session? This will affect existing bookings.')) return

        const result = await cancelSession(sessionId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Session cancelled')
            loadSessions()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Sessions</h1>
                    <p className="text-muted-foreground">Manage your specific availability blocks</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/doctor">Back</Link>
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Create Session</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Session</DialogTitle>
                                <DialogDescription>Define a block of time for appointments.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Input
                                            type="time"
                                            required
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Time</Label>
                                        <Input
                                            type="time"
                                            required
                                            value={endTime}
                                            onChange={e => setEndTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Label (Optional)</Label>
                                    <Input
                                        placeholder="e.g. Morning Clinic"
                                        value={label}
                                        onChange={e => setLabel(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Slot Duration (Minutes)</Label>
                                    <Input
                                        type="number"
                                        min="5"
                                        step="5"
                                        required
                                        value={slotDuration}
                                        onChange={e => setSlotDuration(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" isLoading={isCreating}>
                                        Create Session
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
                ) : sessions.length === 0 ? (
                    <div className="col-span-full text-center p-8 text-muted-foreground border rounded-lg bg-muted/10">
                        No upcoming sessions scheduled. Create one to start accepting bookings.
                    </div>
                ) : (
                    sessions.map(session => (
                        <Card key={session.id} className={session.status === 'cancelled' ? 'opacity-60 bg-muted' : ''}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {session.label || 'Session'}
                                            {session.status === 'cancelled' && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Cancelled</span>}
                                        </CardTitle>
                                        <CardDescription className="flex items-center mt-1">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            {format(new Date(session.date), 'EEE, MMM d, yyyy')}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm mb-4">
                                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                                </div>
                                <div className="text-xs text-muted-foreground mb-4">
                                    {session.slot_duration_minutes} min slots
                                </div>

                                {session.status === 'active' && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => handleCancel(session.id)}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" /> Cancel Session
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
