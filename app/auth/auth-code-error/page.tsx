import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic";

export default function AuthCodeErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
            <div className="w-full max-w-md">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive">Authentication Error</CardTitle>
                        <CardDescription>
                            There was a problem verifying your identity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            This link may have expired or is invalid. Please try signing in again or request a new invitation.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Link href="/login" className={buttonVariants({ className: "w-full" })}>
                                Back to Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
