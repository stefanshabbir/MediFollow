'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { updateProfile } from "@/app/actions/profile"
import { toast } from "sonner"
import { useState } from "react"

const professionalSchema = z.object({
    specialization: z.string().max(100),
    // Certifications would be a file list + metadata, simplified here
})

export function ProfessionalForm({ profile }: { profile: any }) {
    const [isPending, setIsPending] = useState(false)
    const form = useForm({
        resolver: zodResolver(professionalSchema),
        defaultValues: {
            specialization: profile.specialization || "",
        }
    })

    async function onSubmit(data: any) {
        setIsPending(true)
        try {
            const res = await updateProfile(data)
            if (res.error) toast.error(res.error)
            else toast.success(res.success)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Specialization</FormLabel>
                            <FormControl>
                                <Input placeholder="Cardiology, General Practice..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* PM-014: Certifications - Placeholder for file list implementation */}
                <div className="border p-4 rounded-md bg-slate-50">
                    <h3 className="text-sm font-medium mb-2">Professional Certifications</h3>
                    <p className="text-sm text-muted-foreground mb-4">Upload your medical licenses and certificates.</p>
                    <Button type="button" variant="outline" disabled>
                        Manage Certifications (Feature coming soon)
                    </Button>
                </div>

                <Button type="submit" disabled={isPending}>Save Changes</Button>
            </form>
        </Form>
    )
}
