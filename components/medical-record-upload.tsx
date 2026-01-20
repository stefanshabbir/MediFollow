'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { uploadMedicalRecord } from '@/app/actions/records'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'

interface MedicalRecordUploadProps {
    patientId: string
}

export function MedicalRecordUpload({ patientId }: MedicalRecordUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [description, setDescription] = useState('')
    const [isUploading, setIsUploading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('patientId', patientId)
        formData.append('file', file)
        formData.append('description', description)

        const result = await uploadMedicalRecord(formData)

        if (result.success) {
            toast.success(result.success)
            setFile(null)
            setDescription('')
            // Reset file input
            const fileInput = document.getElementById('record-file') as HTMLInputElement
            if (fileInput) fileInput.value = ''
        } else {
            toast.error(result.error)
        }
        setIsUploading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Medical Record</CardTitle>
                <CardDescription>Upload a new medical record or file for this patient</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="record-file">File</Label>
                        <Input
                            id="record-file"
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleFileChange}
                            required
                            disabled={isUploading}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Accepted formats: PDF, PNG, JPG, WEBP</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the record..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isUploading}
                        />
                    </div>

                    <Button type="submit" disabled={!file || isUploading} className="w-full">
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Record
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
