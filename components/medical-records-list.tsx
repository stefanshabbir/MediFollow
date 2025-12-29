'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface MedicalRecord {
    id: string
    file_name: string
    description: string | null
    created_at: string
    signedUrl: string
    doctor?: {
        full_name: string
    }
}

interface MedicalRecordsListProps {
    records: MedicalRecord[]
}

export function MedicalRecordsList({ records }: MedicalRecordsListProps) {
    if (records.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Medical Records</CardTitle>
                    <CardDescription>No records found for this patient.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>History of uploaded medical documents</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {records.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 p-2 bg-primary/10 rounded-full text-primary">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{record.file_name}</h4>
                                    {record.description && (
                                        <p className="text-sm text-muted-foreground">{record.description}</p>
                                    )}
                                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                        <span>Uploaded by {record.doctor?.full_name || 'Unknown'}</span>
                                        <span>•</span>
                                        <span>{format(new Date(record.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <a href={record.signedUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View
                                    </a>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
