"use client"

import { useState } from "react"
import { deleteDoctor } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

export function DoctorsTable({ initialDoctors }: { initialDoctors: any[] }) {
    const [doctors, setDoctors] = useState(initialDoctors)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (doctorId: string) => {
        setIsDeleting(true)
        try {
            const result = await deleteDoctor(doctorId)
            if (result.success) {
                // Optimistically remove from list
                setDoctors(doctors.filter(d => d.id !== doctorId))
                toast.success('Doctor deleted successfully')
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("An error occurred while deleting")
        } finally {
            setIsDeleting(false)
        }
    }

    if (!doctors || doctors.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                    No doctors found. Invite your first doctor to get started.
                </p>
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y bg-card">
                    {doctors.map((doctor: any) => (
                        <tr key={doctor.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                                {doctor.full_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                Doctor
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                    Active
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete Dr. {doctor.full_name}'s account and remove their access to the platform.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                onClick={() => handleDelete(doctor.id)}
                                            >
                                                {isDeleting ? "Deleting..." : "Delete"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
