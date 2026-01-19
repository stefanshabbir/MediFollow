'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // Need to check if avatar exists, assuming yes or will implement standard img
import { toast } from "sonner"

interface AvatarUploadProps {
    value?: string
    onChange: (url: string) => void
    onRemove: () => void
}

export function AvatarUpload({ value, onChange, onRemove }: AvatarUploadProps) {
    const [preview, setPreview] = useState(value)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // PM-010, PM-011 Validation
        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error("Image must be smaller than 5MB")
            return
        }
        if (!file.type.startsWith("image/")) {
            toast.error("File must be an image")
            return
        }

        // Mock Upload - in real app, upload to Supabase Storage here and get public URL
        // For now, we simulate a URL or use a placeholder/base64 for demo
        // const { data, error } = await supabase.storage.from('avatars').upload(...)

        // Simulating succesful upload
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)
        onChange(objectUrl) // In real app, this would be the remote URL
        toast.success("Avatar uploaded (simulation)")
    }

    return (
        <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border">
                {preview ? (
                    <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">
                        No Img
                    </div>
                )}
            </div>
            <div className="space-y-2">
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        Upload New
                    </Button>
                    {value && (
                        <Button type="button" variant="destructive" onClick={() => {
                            setPreview("")
                            onRemove()
                        }}>
                            Remove
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    Recommended 500x500px. Max 5MB.
                </p>
            </div>
        </div>
    )
}
