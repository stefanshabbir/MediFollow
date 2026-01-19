'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PersonalForm } from "./personal-form"
import { AccountSettings } from "./account-settings"
import { PreferencesForm } from "./preferences-form"
import { ProfessionalForm } from "./professional-form"

interface ProfileLayoutProps {
    profile: any
}

export function ProfileLayout({ profile }: ProfileLayoutProps) {
    const isDoctor = profile.role === 'doctor' || profile.role === 'admin' // Admin might want to see it too? Let's stick to strict doctor check or admin if applicable.

    return (
        <Tabs defaultValue="personal" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
                <TabsTrigger value="personal" className="py-2">Personal Details</TabsTrigger>
                {isDoctor && (
                    <TabsTrigger value="professional" className="py-2">Professional</TabsTrigger>
                )}
                <TabsTrigger value="account" className="py-2">Account Security</TabsTrigger>
                <TabsTrigger value="preferences" className="py-2">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Update your personal details and public profile information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PersonalForm profile={profile} />
                    </CardContent>
                </Card>
            </TabsContent>

            {isDoctor && (
                <TabsContent value="professional">
                    <Card>
                        <CardHeader>
                            <CardTitle>Professional Profile</CardTitle>
                            <CardDescription>
                                Manage your specialization and certifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProfessionalForm profile={profile} />
                        </CardContent>
                    </Card>
                </TabsContent>
            )}

            <TabsContent value="account">
                <Card>
                    <CardHeader>
                        <CardTitle>Account Security</CardTitle>
                        <CardDescription>
                            Manage your email, password, and account deletion.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AccountSettings profile={profile} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="preferences">
                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>
                            Customize your privacy, notifications, and language settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PreferencesForm profile={profile} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
