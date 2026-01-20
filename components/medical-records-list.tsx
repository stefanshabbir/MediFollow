import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, ExternalLink, StickyNote } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface MedicalRecord {
    id: string
    file_name: string | null
    file_url: string | null
    description: string | null
    content: string | null
    status: string
    created_at: string
    signedUrl: string | null
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
                <CardDescription>History of clinical notes and medical documents</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {records.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 p-2 rounded-full ${record.content ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'bg-primary/10 text-primary'}`}>
                                    {record.content ? <StickyNote className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold">{record.file_name || 'Clinical Consultation Note'}</h4>
                                        {record.status === 'draft' && <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100 dark:text-amber-200 dark:border-amber-700 dark:bg-amber-900">Draft</Badge>}
                                    </div>

                                    {record.description && (
                                        <p className="text-sm text-muted-foreground">{record.description}</p>
                                    )}
                                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                        <span>{record.doctor?.full_name || 'Unknown Doctor'}</span>
                                        <span>•</span>
                                        <span>{format(new Date(record.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {record.signedUrl ? (
                                    <Button asChild variant="outline" size="sm">
                                        <a href={record.signedUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View File
                                        </a>
                                    </Button>
                                ) : record.content ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <StickyNote className="h-4 w-4 mr-2" />
                                                Read Note
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Consultation Note</DialogTitle>
                                                <DialogDescription>
                                                    Recorded on {format(new Date(record.created_at), 'PPP p')} by {record.doctor?.full_name}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="mt-4 p-4 border rounded-md bg-muted/30 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                                                {record.content}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
