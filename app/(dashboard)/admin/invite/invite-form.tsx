"use client";

import { useState, useTransition } from "react";
import { inviteDoctor } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form";

export function InviteDoctorForm() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            try {
                const result = await inviteDoctor(formData);

                if (result?.error) {
                    setError(result.error);
                } else if (result?.success) {
                    setSuccess(result.success);
                    (event.target as HTMLFormElement).reset();
                }
            } catch (submissionError) {
                console.error(submissionError);
                setError("Something went wrong. Please try again.");
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invite Doctor</CardTitle>
                <CardDescription>
                    Send an invitation email to a doctor to join your organization.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Doctor Name</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            placeholder="Dr. Jane Smith"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="doctor@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        <select
                            id="specialization"
                            name="specialization"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        >
                            <option value="">Select Specialization...</option>
                            <option value="General Practice">General Practice</option>
                            <option value="Cardiology">Cardiology</option>
                            <option value="Dermatology">Dermatology</option>
                            <option value="Pediatrics">Pediatrics</option>
                            <option value="Neurology">Neurology</option>
                            <option value="Orthopedics">Orthopedics</option>
                            <option value="Psychiatry">Psychiatry</option>
                        </select>
                    </div>


                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                            {success}
                        </div>
                    )}

                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Sending Invite..." : "Send Invitation"}
                    </Button>


                </form>
            </CardContent>
        </Card>
    );
}
