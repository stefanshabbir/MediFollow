'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateProfile } from "@/app/actions/profile"
import { AvatarUpload } from "./avatar-upload"
import { useState } from "react"

const personalSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
    phone: z.string().optional(), // Validation in action/server using libphonenumber, strict Zod here can be basic
    bio: z.string().max(2000).optional(),
    avatar_url: z.string().optional(),
    address: z.string().optional(),
})

type PersonalFormValues = z.infer<typeof personalSchema>

export function PersonalForm({ profile }: { profile: any }) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<PersonalFormValues>({
        resolver: zodResolver(personalSchema),
        defaultValues: {
            full_name: profile.full_name || "",
            phone: profile.phone || "",
            bio: profile.bio || "",
            avatar_url: profile.avatar_url || "",
            address: profile.address || "",
        },
    })

    async function onSubmit(data: PersonalFormValues) {
        setIsPending(true)
        try {
            const result = await updateProfile(data as any) // Partial update is handled by server, but we send full form here
            if (result.error) {
                // If server returns validation errors in details
                if (result.details) {
                    Object.entries(result.details).forEach(([key, msgs]) => {
                        // @ts-ignore
                        form.setError(key, { message: msgs[0] })
                    })
                }
                toast.error(result.error)
            } else {
                toast.success(result.success)
                form.reset(data) // Reset dirty state
            }
        } catch (error) {
            toast.error("Something went wrong.")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="space-y-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                    <FormField
                        control={form.control}
                        name="avatar_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Profile Picture</FormLabel>
                                <FormControl>
                                    <AvatarUpload
                                        value={field.value}
                                        onChange={field.onChange}
                                        onRemove={() => field.onChange("")}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="+1 555 123 4567" type="tel" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Detailed international format (E.164) prefered.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Role Based Visibility: Bio is hidden for Patient (PM-028) */}
                    {profile.role !== 'patient' && (
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Professional Bio</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us about your experience..."
                                            className="resize-none min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Visible on your public profile.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="123 Hospital St, City" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isPending}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
