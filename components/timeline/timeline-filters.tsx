'use client'

import * as React from 'react'
import { Search, Calendar as CalendarIcon, FilterX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { TimelineEventType } from '@/app/(dashboard)/timeline/actions'

interface TimelineFiltersProps {
    onSearchChange: (value: string) => void
    onTypeChange: (value: TimelineEventType | 'all') => void
    onDateRangeChange: (range: { from?: Date, to?: Date }) => void
}

export function TimelineFilters({ onSearchChange, onTypeChange, onDateRangeChange }: TimelineFiltersProps) {
    const [date, setDate] = React.useState<{ from?: Date, to?: Date } | undefined>()

    const handleDateSelect = (newDate: { from?: Date, to?: Date } | undefined) => {
        // Shadcn calendar range mode returns { from, to } usually
        setDate(newDate)
        onDateRangeChange(newDate || {})
    }

    const clearFilters = () => {
        onSearchChange('')
        onTypeChange('all')
        setDate(undefined)
        onDateRangeChange({})
    }

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search timeline..."
                        className="pl-8"
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <Select onValueChange={(val) => onTypeChange(val as TimelineEventType | 'all')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Activities</SelectItem>
                        <SelectItem value="appointment">Appointments</SelectItem>
                        <SelectItem value="clinical_note">Clinical Notes</SelectItem>
                        <SelectItem value="status_change">Status Changes</SelectItem>
                        <SelectItem value="file_upload">Files</SelectItem>
                    </SelectContent>
                </Select>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full md:w-[240px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date as any}
                            onSelect={handleDateSelect}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>

                <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters">
                    <FilterX className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
