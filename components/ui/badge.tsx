import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Clock, X, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * WCAG AA Compliant Status Badge Component
 * 
 * Color Palette (all verified for 4.5:1+ contrast ratio):
 * 
 * LIGHT MODE:
 * - Approved/Success: bg #D1FAE5 (emerald-100), text #065F46 (emerald-800), border #6EE7B7 (emerald-300)
 * - Pending: bg #DBEAFE (blue-100), text #1E40AF (blue-800), border #93C5FD (blue-300)
 * - Rejected/Cancelled: bg #FEE2E2 (red-100), text #991B1B (red-800), border #FCA5A5 (red-300)
 * - Confirmed: bg #D1FAE5 (emerald-100), text #065F46 (emerald-800), border #6EE7B7 (emerald-300)
 * 
 * DARK MODE (muted/desaturated backgrounds with light text):
 * - Approved/Success: bg #064E3B (emerald-900), text #D1FAE5 (emerald-100), border #047857 (emerald-700)
 * - Pending: bg #1E3A5F (custom blue-900), text #DBEAFE (blue-100), border #1E40AF (blue-800)
 * - Rejected/Cancelled: bg #7F1D1D (red-900), text #FEE2E2 (red-100), border #991B1B (red-800)
 * - Confirmed: bg #064E3B (emerald-900), text #D1FAE5 (emerald-100), border #047857 (emerald-700)
 */

const statusBadgeVariants = cva(
    // Base styles: pill-shaped, centered text, legible font
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
    {
        variants: {
            status: {
                // Approved/Confirmed - Green/Teal
                approved: [
                    // Light mode: soft green with dark text (4.5:1+ contrast)
                    "bg-emerald-100 text-emerald-800 border-emerald-300",
                    // Dark mode: muted dark green with light text
                    "dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700"
                ].join(" "),
                confirmed: [
                    "bg-emerald-100 text-emerald-800 border-emerald-300",
                    "dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700"
                ].join(" "),
                success: [
                    "bg-emerald-100 text-emerald-800 border-emerald-300",
                    "dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700"
                ].join(" "),

                // Pending - Blue/Grey
                pending: [
                    // Light mode: soft blue with dark text
                    "bg-blue-100 text-blue-800 border-blue-300",
                    // Dark mode: muted dark blue with light text
                    "dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700"
                ].join(" "),

                // Rejected/Cancelled - Muted Rose
                rejected: [
                    "bg-red-100 text-red-800 border-red-300",
                    "dark:bg-red-900 dark:text-red-100 dark:border-red-700"
                ].join(" "),
                cancelled: [
                    "bg-red-100 text-red-800 border-red-300",
                    "dark:bg-red-900 dark:text-red-100 dark:border-red-700"
                ].join(" "),

                // Action Required - Amber/Orange
                awaiting_payment: [
                    "bg-amber-100 text-amber-800 border-amber-300",
                    "dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700"
                ].join(" "),

                // Default/Secondary - Neutral
                default: [
                    "bg-slate-100 text-slate-800 border-slate-300",
                    "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
                ].join(" "),
            },
        },
        defaultVariants: {
            status: "default",
        },
    }
)

// Icon mapping for accessibility (not relying on color alone)
const statusIcons: Record<string, React.ElementType> = {
    approved: Check,
    confirmed: Check,
    success: Check,
    pending: Clock,
    rejected: X,
    cancelled: X,
    awaiting_payment: AlertCircle, // Use AlertCircle or import CreditCard if preferred. Let's stick to existing imports or use AlertCircle for now as it's an alert.
    default: AlertCircle,
}

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
    /** The status to display */
    status: 'approved' | 'confirmed' | 'success' | 'pending' | 'rejected' | 'cancelled' | 'awaiting_payment' | 'default'
    /** Custom label text (if not provided, capitalizes status) */
    label?: string
    /** Hide the icon (not recommended for accessibility) */
    hideIcon?: boolean
}

/**
 * StatusBadge - Accessible status indicator component
 * 
 * Features:
 * - WCAG AA compliant contrast ratios (4.5:1+)
 * - Icons alongside text for color-blind users
 * - Semantic HTML with ARIA role
 * - Scalable fonts (rem units via Tailwind)
 * - System-aware dark/light mode theming
 */
export function StatusBadge({
    status,
    label,
    hideIcon = false,
    className,
    ...props
}: StatusBadgeProps) {
    const Icon = statusIcons[status] || statusIcons.default
    const displayLabel = label || (status.charAt(0).toUpperCase() + status.slice(1)).replace(/_/g, " ")

    return (
        <span
            role="status"
            aria-label={`Status: ${displayLabel}`}
            className={cn(statusBadgeVariants({ status }), className)}
            {...props}
        >
            {!hideIcon && (
                <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                />
            )}
            <span>{displayLabel}</span>
        </span>
    )
}

// Legacy Badge component for backward compatibility
const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
    {
        variants: {
            variant: {
                default: "bg-sky-500 text-white border-transparent",
                secondary: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600",
                destructive: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700",
                outline: "bg-transparent text-slate-700 border-slate-400 dark:text-slate-200 dark:border-slate-500",
                success: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700",
                warning: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700",
                pending: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
