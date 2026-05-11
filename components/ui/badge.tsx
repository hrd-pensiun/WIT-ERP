import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[0.7rem] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:   "bg-primary/15 text-emerald-400 border-emerald-500/20",
        secondary: "bg-white/[0.06] text-zinc-400 border-white/[0.08]",
        destructive: "bg-red-500/10 text-red-400 border-red-500/20",
        outline:   "border-white/10 text-zinc-400",
        ghost:     "text-zinc-400 hover:bg-white/[0.06]",
        link:      "text-emerald-400 underline-offset-4 hover:underline",
        /* Semantic status badges — translucent backgrounds */
        success:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
        info:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
        error:     "bg-red-500/10 text-red-400 border-red-500/20",
        purple:    "bg-violet-500/10 text-violet-400 border-violet-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

/** Convenience: maps arbitrary status strings to badge variants. */
function StatusBadge({
  status,
  label,
  className,
}: {
  status: string
  label?: string
  className?: string
}) {
  const map: Record<string, BadgeVariant> = {
    active: "success", operational: "success", paid: "success",
    completed: "success", done: "success", approved: "success",
    pending: "warning", in_progress: "info", planning: "info",
    inactive: "secondary", draft: "secondary", cancelled: "secondary",
    overdue: "error", failed: "error", rejected: "error",
    lead: "purple", negotiation: "purple",
  }
  const key = status.toLowerCase().replace(/\s+/g, "_")
  const resolvedVariant: BadgeVariant = map[key] ?? "secondary"
  return (
    <Badge variant={resolvedVariant} className={className}>
      {label ?? status}
    </Badge>
  )
}

export { Badge, badgeVariants, StatusBadge }
