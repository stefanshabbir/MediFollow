'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { updateEmail, changePassword, softDeleteAccount } from "@/app/(auth)/actions"

export function AccountSettings({ profile }: { profile: any }) {
    const [email, setEmail] = useState(profile.email || "") // Note: profile might not have email if it's in auth.users only, need to pass it down or fetch
    // Wait, profiles table doesn't strictly store email usually in Supabase, it's in auth.users. 
    // But we can assume it's passed or we fetch it. 
    // Ideally `profile` prop has it if we joined or fetched auth user data in Page.
    // In `page.tsx`, we fetched `profile`. We also fetched `user`. 
    // We should pass `email` explicitly from `page.tsx` or assume `profile` has it if we synced it.
    // I'll assume we might need to handle it. For now, let's just allow typing a new email.

    const [currentPw, setCurrentPw] = useState("")
    const [newPw, setNewPw] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleEmailUpdate(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const res = await updateEmail(email)
        setLoading(false)
        if (res.error) toast.error(res.error)
        else toast.success(res.success)
    }

    async function handlePasswordUpdate(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const res = await changePassword(currentPw, newPw)
        setLoading(false)
        if (res.error) toast.error(res.error)
        else {
            toast.success(res.success)
            setCurrentPw("")
            setNewPw("")
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure? This will deactivate your account.")) return
        setLoading(true)
        const res = await softDeleteAccount()
        if (res.error) {
            setLoading(false)
            toast.error(res.error)
        }
        // Redirect handled in action
    }

    return (
        <div className="space-y-8">
            {/* Email Update */}
            <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium">Update Email</h3>
                <form onSubmit={handleEmailUpdate} className="space-y-3">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="email">New Email Address</Label>
                        <Input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <Button type="submit" variant="outline" disabled={loading}>Update Email</Button>
                </form>
            </div>

            {/* Password Update */}
            <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium">Change Password</h3>
                <form onSubmit={handlePasswordUpdate} className="space-y-3">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="current-pw">Current Password</Label>
                        <Input type="password" id="current-pw" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="new-pw">New Password</Label>
                        <Input type="password" id="new-pw" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} />
                        <p className="text-[0.8rem] text-muted-foreground">Must be at least 8 characters.</p>
                    </div>
                    <Button type="submit" disabled={loading}>Change Password</Button>
                </form>
            </div>

            {/* Danger Zone */}
            <div className="space-y-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 rounded-md">
                <h3 className="font-medium text-red-700 dark:text-red-400">Danger Zone</h3>
                <p className="text-sm text-red-600 dark:text-red-300">Deactivating your account will disable login.</p>
                <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                    Deactivate Account
                </Button>
            </div>
        </div>
    )
}
