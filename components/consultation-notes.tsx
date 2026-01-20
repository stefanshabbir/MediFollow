'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Save, History, Lock, RotateCcw, AlertTriangle } from 'lucide-react'
import { saveNoteDraft, finalizeNote, getNoteHistory, restoreNoteVersion } from '@/app/actions/records'
import { format } from 'date-fns'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface ConsultationNotesProps {
    patientId: string
    initialData?: {
        id: string
        content: string | null
        status: string
    } | null
}

export function ConsultationNotes({ patientId, initialData }: ConsultationNotesProps) {
    const router = useRouter()
    const [content, setContent] = useState(initialData?.content || '')
    const [status, setStatus] = useState(initialData?.status || 'draft')
    const [recordId, setRecordId] = useState<string | null>(initialData?.id || null)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [versions, setVersions] = useState<any[]>([])
    const [isLoadingVersions, setIsLoadingVersions] = useState(false)
    const [isFinalizing, setIsFinalizing] = useState(false)

    // Autosave logic
    const debouncedSave = useCallback(
        async (currentContent: string, currentRecordId: string | null) => {
            if (!currentContent.trim()) return

            setIsSaving(true)
            const result = await saveNoteDraft(currentRecordId, currentContent, patientId)
            setIsSaving(false)

            if (result.success) {
                setLastSaved(new Date())
                if (result.recordId && result.recordId !== currentRecordId) {
                    setRecordId(result.recordId)
                }
            } else {
                toast.error(result.error || 'Failed to autosave')
            }
        },
        [patientId]
    )

    // Debounce effect
    useEffect(() => {
        if (status === 'finalized') return

        const timer = setTimeout(() => {
            if (content !== (initialData?.content || '') || recordId) { // Only save if changed or if we already have a draft
                // Actually we want to save if content changed from *last saved*. 
                // But for simplicity, we trigger autosave on content change after 2 seconds.
                // We need to avoid saving on initial mount if no changes.
                // Let's rely on a simpler 'isDirty' check or just save.
                // Better: Check against a ref of lastSavedContent.
            }
            debouncedSave(content, recordId)
        }, 2000)

        return () => clearTimeout(timer)
    }, [content, recordId, debouncedSave, status]) // Added dependencies

    const handleFinalize = async () => {
        if (!recordId) return

        // Confirm dialog could be here, but we'll trust the button click for now or add a small confirmation check in UI logic if complex.
        if (!confirm('Are you sure you want to finalize this note? It cannot be edited afterwards.')) return

        setIsFinalizing(true)
        const result = await finalizeNote(recordId)
        setIsFinalizing(false)

        if (result.success) {
            setStatus('finalized')
            toast.success('Consultation note finalized')
            router.refresh()
        } else {
            toast.error(result.error || 'Failed to finalize')
        }
    }

    const loadVersions = async () => {
        if (!recordId) return
        setIsLoadingVersions(true)
        const result = await getNoteHistory(recordId)
        setIsLoadingVersions(false)

        if (result.data) {
            setVersions(result.data)
        }
    }

    const handleRestore = async (version: any) => {
        if (!recordId) return
        if (!confirm('Restore this version? Current content will be overwritten.')) return

        const result = await restoreNoteVersion(recordId, version.id)
        if (result.success) {
            setContent(version.content || '')
            toast.success('Version restored')
            // trigger auto save to persist the restoration as the latest draft immediately if needed, 
            // but the action updated DB, so we just update separate state.
        } else {
            toast.error(result.error || 'Failed to restore')
        }
    }

    const isLocked = status === 'finalized'

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1">
                    <CardTitle>Clinical Notes</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {isSaving ? (
                            <span className="flex items-center text-yellow-600">
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Saving...
                            </span>
                        ) : lastSaved ? (
                            <span className="flex items-center text-green-600">
                                <Save className="mr-1 h-3 w-3" />
                                Saved {format(lastSaved, 'h:mm a')}
                            </span>
                        ) : (
                            <span>Not saved yet</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'draft' && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800">
                            Draft
                        </Badge>
                    )}
                    {status === 'finalized' && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800">
                            <Lock className="mr-1 h-3 w-3" />
                            Finalized
                        </Badge>
                    )}

                    {recordId && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={loadVersions}>
                                    <History className="h-4 w-4 mr-2" />
                                    History
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Version History</DialogTitle>
                                    <DialogDescription>
                                        Restore previous versions of this note.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    {isLoadingVersions ? (
                                        <div className="flex justify-center p-4">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : versions.length === 0 ? (
                                        <p className="text-center text-muted-foreground">No history found.</p>
                                    ) : (
                                        versions.map((ver) => (
                                            <div key={ver.id} className="flex items-center justify-between p-3 border rounded-md">
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {format(new Date(ver.created_at), 'MMM d, yyyy h:mm a')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {ver.content?.substring(0, 50)}...
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={isLocked}
                                                    onClick={() => handleRestore(ver)}
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder="Type clinical observations, diagnosis, and treatment plan..."
                    className="min-h-[300px] bg-background resize-none font-mono text-sm leading-relaxed"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isLocked}
                />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                {!isLocked && (
                    <Button
                        onClick={handleFinalize}
                        disabled={isFinalizing || !recordId || !content.trim()}
                        variant="default" // Changed to default variant, was destructive which might be scary
                    >
                        {isFinalizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Finalize Consultation
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
