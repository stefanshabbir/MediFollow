import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: Vibrant sky blue with white text (matches "Request Appointment" style)
        default: "bg-sky-500 text-white shadow-md hover:bg-sky-600 focus-visible:ring-sky-400",
        // Destructive: Soft rose for negative actions
        destructive: "bg-rose-500 text-white shadow-md hover:bg-rose-600 focus-visible:ring-rose-400",
        // Outline: Light with visible border in both modes
        outline: "border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-sky-500 dark:border-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-sky-400",
        // Secondary: Uses the vibrant sky blue style (same as default for consistency)
        secondary: "bg-sky-500 text-white shadow-md hover:bg-sky-600 focus-visible:ring-sky-400",
        // Ghost: Minimal but visible
        ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
        // Link: Text only
        link: "text-sky-600 underline-offset-4 hover:underline dark:text-sky-400",
        // Success: Green for positive actions
        success: "bg-emerald-500 text-white shadow-md hover:bg-emerald-600 focus-visible:ring-emerald-400",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
