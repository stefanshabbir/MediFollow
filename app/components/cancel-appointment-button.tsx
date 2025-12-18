"use client"

import { toast } from "sonner"
import { cancelAppointment } from "@/app/appointments/actions"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Props {
    id: string
}

export function CancelAppointmentButton({ id }: Props) {
    const [isLoading, setIsLoading] = useState(false)

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return

        setIsLoading(true)
        try {
            const result = await cancelAppointment(id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Appointment cancelled')
            }
        } catch (error) {
            console.error("Failed to cancel appointment:", error)
            toast.error("An error occurred while canceling the appointment")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            size="sm"
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
        >
            {isLoading ? "Canceling..." : "Cancel"}
        </Button>
    )
}
