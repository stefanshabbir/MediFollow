'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { TimelineEvent } from '@/app/(dashboard)/timeline/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, FileText, Activity, FileIcon, Clock, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface TimelineItemProps {
    event: TimelineEvent
    isLastInGroup?: boolean
    isGrouped?: boolean
}

export function TimelineItem({ event, isLastInGroup, isGrouped }: TimelineItemProps) {
    const [expanded, setExpanded] = React.useState(false)

    const getIcon = () => {
        switch (event.type) {
            case 'appointment': return <Calendar className="h-4 w-4 text-blue-500" />
            case 'clinical_note': return <FileText className="h-4 w-4 text-green-500" />
            case 'record_update': return <Activity className="h-4 w-4 text-orange-500" />
            case 'file_upload': return <FileIcon className="h-4 w-4 text-purple-500" />
            case 'status_change': return <Clock className="h-4 w-4 text-gray-500" />
            default: return <Activity className="h-4 w-4" />
        }
    }

    const getStatusColor = (status?: string) => {
        if (!status) return 'secondary'
        switch (status.toLowerCase()) {
            case 'confirmed':
            case 'completed':
            case 'finalized':
                return 'default'
            case 'pending': return 'secondary'
            case 'cancelled': return 'destructive'
            default: return 'outline'
        }
    }

    const isExpandable = event.metadata?.fullContent || (event.description && event.description.length > 100)

    return (
        <div className={cn("relative pl-8 group", isGrouped ? "pb-4 last:pb-0" : "pb-8 last:pb-0")}>

            {/* Connector Line Logic 
         - If NOT grouped: Typical behavior (line if not last in main list... but handling this in parent is better for list-level)
         - If grouped:
           - Render line connecting to next sibling
      */}

            {/* 
          This component renders ONE item. 
          The parent loop manages the "List" vertical line.
          But here we can render the local line.
      */}

            {/* Icon Bubble */}
            <div className={cn(
                "absolute left-0 h-6 w-6 rounded-full border bg-background flex items-center justify-center shadow-sm z-10",
                isGrouped ? "top-1 h-5 w-5 left-[2px] text-xs" : "top-1"
            )}>
                {getIcon()}
            </div>

            <Card className={cn("transition-colors", isGrouped ? "border-l-4 border-l-blue-100 shadow-none bg-muted/20" : "hover:bg-accent/5")}>
                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold">{event.title}</CardTitle>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(new Date(event.date), 'MMM d, h:mm a')}
                                </span>
                            </div>
                            {event.status && (
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={getStatusColor(event.status) as any}>
                                        {event.status}
                                    </Badge>
                                    {isGrouped && event.previousAppointmentId && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <LinkIcon className="h-3 w-3" /> Follow-up
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {isExpandable && (
                            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    {event.description && (
                        <div className={cn("text-sm text-muted-foreground", !expanded && "line-clamp-2")}>
                            {event.description}
                        </div>
                    )}

                    {expanded && event.type === 'clinical_note' && event.metadata?.fullContent && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm border">
                            <h4 className="font-semibold mb-1 text-foreground">Full Note:</h4>
                            <div className="whitespace-pre-wrap">{event.metadata.fullContent}</div>
                        </div>
                    )}

                    {event.type === 'file_upload' && event.metadata?.fileUrl && (
                        <div className="mt-2">
                            <a
                                href={event.metadata.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <FileIcon className="h-3 w-3" />
                                View Attachment
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
