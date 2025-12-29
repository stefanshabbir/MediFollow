"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { approveAppointmentRequest, rejectAppointmentRequest } from "@/app/appointments/actions"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
import { format } from "date-fns"

interface AppointmentRequest {
    id: string
    patient: { full_name: string }
    doctor?: { full_name: string }
    appointment_date: string
    start_time: string
    end_time: string
    status: 'pending' | 'approved' | 'rejected'
    notes?: string
}

interface Props {
    initialRequests: AppointmentRequest[]
    role: 'doctor' | 'admin' | 'patient'
}

export function AppointmentRequestsTable({ initialRequests, role }: Props) {
    console.log('client: initialRequests', initialRequests)
    const [requests, setRequests] = useState(initialRequests)
    useEffect(() => {
        setRequests(initialRequests)
    }, [initialRequests])

    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
        setLoadingId(requestId)
        try {
            const result = action === 'approve'
                ? await approveAppointmentRequest(requestId)
                : await rejectAppointmentRequest(requestId)

            if (result.success) {
                // Update local state
                setRequests(prev => prev.map(req =>
                    req.id === requestId
                        ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' }
                        : req
                ))
                toast.success(action === 'approve' ? 'Request approved' : 'Request rejected')
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            console.error("Action failed:", error)
            toast.error("An error occurred")
        } finally {
            setLoadingId(null)
        }
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">No appointment requests found.</p>
            </div>
        )
    }

    // Role-specific columns visibility
    const showPatient = role !== 'patient'
    const showDoctor = role === 'admin' || role === 'patient'
    const showActions = role !== 'patient'

    return (
        <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Time</th>
                        {showPatient && <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Patient</th>}
                        {showDoctor && <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Doctor</th>}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Notes</th>
                        {showActions && <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y bg-card">
                    {requests.map((request) => (
                        <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-sm text-foreground">
                                {format(new Date(request.appointment_date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                                {request.start_time.substring(0, 5)} - {request.end_time.substring(0, 5)}
                            </td>
                            {showPatient && (
                                <td className="px-6 py-4 text-sm text-foreground font-medium">
                                    {request.patient?.full_name || 'Unknown'}
                                </td>
                            )}
                            {showDoctor && (
                                <td className="px-6 py-4 text-sm text-foreground font-medium">
                                    {request.doctor?.full_name || 'Unknown'}
                                </td>
                            )}
                            <td className="px-6 py-4">
                                <StatusBadge status={request.status} />
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate" title={request.notes}>
                                {request.notes || '-'}
                            </td>
                            {showActions && (
                                <td className="px-6 py-4 text-right space-x-2">
                                    {request.status === 'pending' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                disabled={loadingId === request.id}
                                                onClick={() => handleAction(request.id, 'reject')}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="success"
                                                disabled={loadingId === request.id}
                                                onClick={() => handleAction(request.id, 'approve')}
                                            >
                                                {loadingId === request.id ? '...' : 'Approve'}
                                            </Button>
                                        </>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
