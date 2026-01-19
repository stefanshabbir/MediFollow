'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Or native select
import { updateProfile } from "@/app/actions/profile"
import { toast } from "sonner"
import { useState } from "react"
// Need to check if Select exists or install it. Assuming basic Select or fallback to native.
// I will use native select for simplicity if Select component is not guaranteed, but I saw checkbox. 
// Standard shadcn Select requires installing. I'll use native <select> to be safe.

const preferencesSchema = z.object({
    preferences: z.object({
        privacy_settings: z.object({
            is_public: z.boolean().default(false),
        }),
        notifications: z.object({
            email_updates: z.boolean().default(true),
            in_app: z.boolean().default(true),
        }),
        language: z.string().default("en"),
        timezone: z.string().default("UTC"),
    })
})

export function PreferencesForm({ profile }: { profile: any }) {
    const [isPending, setIsPending] = useState(false)

    const defaultPrefs = profile.preferences || {}

    const form = useForm({
        resolver: zodResolver(preferencesSchema),
        defaultValues: {
            preferences: {
                privacy_settings: {
                    is_public: defaultPrefs.privacy_settings?.is_public ?? false
                },
                notifications: {
                    email_updates: defaultPrefs.notifications?.email_updates ?? true,
                    in_app: defaultPrefs.notifications?.in_app ?? true
                },
                language: defaultPrefs.language || "en",
                timezone: defaultPrefs.timezone || "UTC"
            }
        }
    })

    async function onSubmit(data: any) {
        setIsPending(true)
        try {
            const res = await updateProfile(data)
            if (res.error) toast.error(res.error)
            else toast.success("Preferences updated")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="space-y-4">
                    <h3 className="font-medium text-sm">Privacy</h3>
                    <FormField
                        control={form.control}
                        name="preferences.privacy_settings.is_public"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Public Profile
                                    </FormLabel>
                                    <FormDescription>
                                        Allow your profile (Name, Bio) to be viewed via a public link (PM-026).
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="font-medium text-sm">Localization</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="preferences.language"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Language</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                        >
                                            <option value="en">English (US)</option>
                                            <option value="si">Sinhala (PM-018)</option>
                                        </select>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" disabled={isPending}>Save Preferences</Button>
            </form>
        </Form>
    )
}
