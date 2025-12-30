"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isCheckingSession, setIsCheckingSession] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        const handleAuth = async () => {
            // 1. Check if we have hash parameters (Invite/Reset link)
            const hash = window.location.hash
            if (hash && hash.includes("access_token")) {
                try {
                    // Extract tokens from hash keys
                    const params = new URLSearchParams(hash.substring(1)) // remove the #
                    const accessToken = params.get("access_token")
                    const refreshToken = params.get("refresh_token")

                    if (accessToken && refreshToken) {
                        const { error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        })

                        if (error) {
                            console.error("Error setting session from hash:", error)
                            setError("Invalid or expired invitation link.")
                        } else {
                            // Successfully set session
                            setIsCheckingSession(false)
                            // Clear hash to clean up URL
                            window.history.replaceState(null, "", window.location.pathname)
                            return
                        }
                    }
                } catch (e) {
                    console.error("Error parsing hash:", e)
                }
            }

            // 2. Fallback: Check existing session or listen for changes
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setIsCheckingSession(false)
                return
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || session) {
                    setIsCheckingSession(false)
                }
            })

            return () => subscription.unsubscribe()
        }

        handleAuth()
    }, [])

    if (isCheckingSession) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
                <div className="text-center">
                    <p className="text-muted-foreground">Verifying invitation...</p>
                </div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setIsLoading(true)

        const supabase = createClient()

        // Update the user's password and mark as password_set
        const { error: updateError } = await supabase.auth.updateUser({
            password: password,
            data: {
                password_set: true
            }
        })

        if (updateError) {
            setError(updateError.message)
            setIsLoading(false)
            return
        }

        // Redirect to root, middleware will handle role-based redirect
        router.push('/')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
            <div className="w-full max-w-md">
                <Card>
                    <CardHeader>
                        <CardTitle>Set Your Password</CardTitle>
                        <CardDescription>
                            Welcome! Please set a password for your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? "Setting password..." : "Set Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
