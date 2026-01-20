"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { searchDiagnoses, type Diagnosis } from "@/app/actions/treatment-plan"
import { useDebounce } from "@/hooks/use-debounce" // Assuming this exists, if not I'll implement a simple one inside

export function DiagnosisAutocomplete({
    onSelect,
}: {
    onSelect: (diagnosis: Diagnosis) => void
}) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [query, setQuery] = React.useState("")
    const [diagnoses, setDiagnoses] = React.useState<Diagnosis[]>([])
    const [loading, setLoading] = React.useState(false)

    // Simple debounce implementation since I'm not sure if the hook exists
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                handleSearch(query)
            } else {
                setDiagnoses([])
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    const handleSearch = async (search: string) => {
        setLoading(true)
        const result = await searchDiagnoses(search)
        if (result.data) {
            setDiagnoses(result.data)
        }
        setLoading(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? diagnoses.find((d) => d.name === value)?.name || value
                        : "Select diagnosis..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <div className="p-2">
                    <Input
                        placeholder="Search diagnosis..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="mb-2"
                    />
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {loading && <div className="text-sm text-center p-2 text-muted-foreground">Loading...</div>}

                        {!loading && diagnoses.length === 0 && query && (
                            <div className="text-sm text-center p-2 text-muted-foreground">No diagnosis found.</div>
                        )}

                        {!loading && diagnoses.map((diagnosis) => (
                            <div
                                key={diagnosis.id}
                                className={cn(
                                    "flex items-center rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                    value === diagnosis.name ? "bg-accent" : ""
                                )}
                                onClick={() => {
                                    setValue(diagnosis.name)
                                    onSelect(diagnosis)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === diagnosis.name ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {diagnosis.name}
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
