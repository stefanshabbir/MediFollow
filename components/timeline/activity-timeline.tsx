'use client'

import * as React from 'react'
import { TimelineThread, getPatientTimeline, TimelineEventType } from '@/app/(dashboard)/timeline/actions'
import { TimelineItem } from './timeline-item'
import { TimelineFilters } from './timeline-filters'
import { Loader2, RefreshCcw, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ActivityTimelineProps {
    initialThreads: TimelineThread[]
    patientId: string
}

export function ActivityTimeline({ initialThreads, patientId }: ActivityTimelineProps) {
    const [threads, setThreads] = React.useState<TimelineThread[]>(initialThreads)
    const [loading, setLoading] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [typeFilter, setTypeFilter] = React.useState<TimelineEventType | 'all'>('all')
    const [dateRange, setDateRange] = React.useState<{ from?: Date, to?: Date } | undefined>()

    // Client-side filtering on THREADS
    // If search matches ANY event in thread, show thread? Or filter strictly?
    // Current requirement: "Filtering". 
    // Let's filter threads: Include thread if ANY event matches criteria.

    const filteredThreads = React.useMemo(() => {
        if (!threads) return []
        return threads.map(thread => {
            // Filter events INSIDE the thread
            const matchingEvents = thread.events.filter(event => {
                // Type Filter
                if (typeFilter !== 'all' && event.type !== typeFilter) return false

                // Date Range
                if (dateRange?.from) {
                    if (new Date(event.date) < dateRange.from) return false
                }
                if (dateRange?.to) {
                    // End of day
                    const toDate = new Date(dateRange.to)
                    toDate.setHours(23, 59, 59, 999)
                    if (new Date(event.date) > toDate) return false
                }

                // Search
                if (search) {
                    const lower = search.toLowerCase()
                    const matchTitle = event.title.toLowerCase().includes(lower)
                    const matchDesc = event.description?.toLowerCase().includes(lower)
                    const matchContent = event.metadata?.fullContent?.toLowerCase().includes(lower)
                    const matchDoc = event.metadata?.doctorName?.toLowerCase().includes(lower)

                    return matchTitle || matchDesc || matchContent || matchDoc
                }
                return true
            })

            if (matchingEvents.length === 0) return null;

            return {
                ...thread,
                events: matchingEvents
            }
        }).filter(t => t !== null) as TimelineThread[]
    }, [threads, search, typeFilter, dateRange])

    // Function to refresh data manually or periodically
    const refresh = async () => {
        setLoading(true)
        try {
            const newThreads = await getPatientTimeline(patientId) // Action now returns threads
            setThreads(newThreads)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Activity Log</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
            </div>

            <TimelineFilters
                onSearchChange={setSearch}
                onTypeChange={setTypeFilter}
                onDateRangeChange={setDateRange as any}
            />

            <div className="relative min-h-[400px]">
                {filteredThreads.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>No activities found matching your criteria.</p>
                    </div>
                ) : (
                    filteredThreads.map(thread => (
                        <div key={thread.id} className="relative">
                            {/* If thread has multiple events, it's a chain */}
                            {thread.events.length > 1 && (
                                <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-blue-100 dark:bg-blue-900/50 -z-10 rounded-full" />
                            )}

                            {thread.events.map((event, index) => (
                                <div key={event.id} className={cn("mb-6 last:mb-0", index > 0 && "mt-2")}>
                                    {/* Connector for chain elements */}
                                    {index > 0 && (
                                        <div className="absolute left-[11px] w-0.5 h-4 -top-3 bg-blue-100" />
                                    )}

                                    <TimelineItem
                                        event={event}
                                        isGrouped={thread.events.length > 1}
                                        isLastInGroup={index === thread.events.length - 1}
                                    />
                                </div>
                            ))}

                            {/* Visual spacer if we want distinct blocks per thread */}
                            <div className="h-8 md:h-12 border-l ml-[11px] border-dashed border-muted-foreground/20 last:hidden" />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
