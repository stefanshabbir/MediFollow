"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <button className="h-9 w-9 rounded-lg border-2 border-slate-300 bg-white flex items-center justify-center">
                <Sun className="h-5 w-5 text-slate-600" />
            </button>
        )
    }

    return (
        <button
            className={`h-9 w-9 rounded-lg border-2 flex items-center justify-center transition-colors ${theme === "light"
                    ? "border-slate-300 bg-white hover:bg-slate-100"
                    : "border-slate-600 bg-slate-800 hover:bg-slate-700"
                }`}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
            {theme === "light" ? (
                <Moon className="h-5 w-5 text-slate-700" />
            ) : (
                <Sun className="h-5 w-5 text-amber-400" />
            )}
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
