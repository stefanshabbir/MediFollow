"use client"

import { useEffect, useState } from 'react'
import { getDoctorSchedule, updateDoctorSchedule } from '@/app/schedule/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function DoctorSchedulePage() {
    const [schedule, setSchedule] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        async function fetchSchedule() {
            const result = await getDoctorSchedule()
            if (result.data) {
                setSchedule(result.data)
            }
            setIsLoading(false)
        }
        fetchSchedule()
    }, [])

    const handleToggleAvailability = (scheduleId: string, currentValue: boolean) => {
        setSchedule(prev => prev.map(s =>
            s.id === scheduleId ? { ...s, is_available: !currentValue } : s
        ))
    }

    const handleTimeChange = (scheduleId: string, field: string, value: string) => {
        setSchedule(prev => prev.map(s =>
            s.id === scheduleId ? { ...s, [field]: value } : s
        ))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setMessage(null)

        // Update each schedule item
        for (const item of schedule) {
            await updateDoctorSchedule(item.id, {
                is_available: item.is_available,
                start_time: item.start_time,
                end_time: item.end_time,
                break_start_time: item.break_start_time || null,
                break_end_time: item.break_end_time || null
            })
        }

        setIsSaving(false)
        setMessage({ type: 'success', text: 'Schedule updated successfully!' })
        setTimeout(() => setMessage(null), 3000)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Loading schedule...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">My Schedule</h1>
                    <p className="text-muted-foreground mt-1">
                        Set your working hours and availability
                    </p>
                </div>
                <Link href="/doctor" className={buttonVariants()}>
                    Back to Dashboard
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                    <CardDescription>
                        Configure your availability for each day of the week
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {schedule.map((daySchedule) => (
                        <div key={daySchedule.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-semibold text-foreground min-w-[120px]">
                                        {DAYS[daySchedule.day_of_week]}
                                    </h3>
                                    <Button
                                        type="button"
                                        variant={daySchedule.is_available ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleToggleAvailability(daySchedule.id, daySchedule.is_available)}
                                    >
                                        {daySchedule.is_available ? 'Available' : 'Unavailable'}
                                    </Button>
                                </div>
                            </div>

                            {daySchedule.is_available && (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`start-${daySchedule.id}`}>Start Time</Label>
                                        <Input
                                            id={`start-${daySchedule.id}`}
                                            type="time"
                                            value={daySchedule.start_time}
                                            onChange={(e) => handleTimeChange(daySchedule.id, 'start_time', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`end-${daySchedule.id}`}>End Time</Label>
                                        <Input
                                            id={`end-${daySchedule.id}`}
                                            type="time"
                                            value={daySchedule.end_time}
                                            onChange={(e) => handleTimeChange(daySchedule.id, 'end_time', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`break-start-${daySchedule.id}`}>Break Start (Optional)</Label>
                                        <Input
                                            id={`break-start-${daySchedule.id}`}
                                            type="time"
                                            value={daySchedule.break_start_time || ''}
                                            onChange={(e) => handleTimeChange(daySchedule.id, 'break_start_time', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`break-end-${daySchedule.id}`}>Break End (Optional)</Label>
                                        <Input
                                            id={`break-end-${daySchedule.id}`}
                                            type="time"
                                            value={daySchedule.break_end_time || ''}
                                            onChange={(e) => handleTimeChange(daySchedule.id, 'break_end_time', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {message && (
                        <div className={`text-sm p-3 rounded-md ${message.type === 'success'
                            ? 'text-green-700 bg-green-50'
                            : 'text-destructive bg-destructive/10'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full"
                        size="lg"
                    >
                        {isSaving ? 'Saving...' : 'Save Schedule'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
