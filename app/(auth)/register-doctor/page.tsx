"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export default function RegisterDoctorPage() {
    const router = useRouter()
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        orgId: ""
    })
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError(null)
        setSuccess(null)

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        startTransition(async () => {
            try {
                const supabase = createClient()

                // 1. Sign up the user
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: {
                        data: {
                            full_name: form.fullName,
                            role: 'doctor',
                        },
                    },
                })

                if (signUpError) {
                    setError(signUpError.message)
                    return
                }

                if (authData.user) {
                    // 2. Create the Profile
                    const { error: profileError } = await supabase.from('profiles').insert({
                        id: authData.user.id,
                        role: 'doctor',
                        organisation_id: form.orgId || null,
                    })

                    if (profileError) {
                        setError(`Profile creation failed: ${profileError.message}`)
                        return
                    }

                    setSuccess("Doctor account created! Redirecting...")
                    setTimeout(() => router.push('/doctor'), 2000)
                }
            } catch (submissionError) {
                console.error(submissionError)
                setError("Something went wrong. Please try again.")
            }
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link
                        href="/"
                        className="inline-block text-2xl font-bold text-primary transition-colors hover:text-primary/90"
                    >
                        MediFollow
                    </Link>
                </div>
                <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-semibold">Register as Doctor (Testing)</CardTitle>
                        <CardDescription>
                            Create a doctor account for testing
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full name</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={form.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Dr. John Doe"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleInputChange}
                                    placeholder="doctor@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="orgId">Organisation ID (Optional)</Label>
                                <Input
                                    id="orgId"
                                    name="orgId"
                                    type="text"
                                    value={form.orgId}
                                    onChange={handleInputChange}
                                    placeholder="Leave empty or paste org UUID"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Get this from the admin dashboard or leave empty
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleInputChange}
                                    placeholder="At least 6 characters"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                                    {success}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-11 text-base font-medium"
                            >
                                {isPending ? "Creating account..." : "Create Doctor Account"}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground pt-2">
                                <Link
                                    href="/login"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
