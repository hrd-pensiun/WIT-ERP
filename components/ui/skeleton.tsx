import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md animate-shimmer", className)}
      {...props}
    />
  )
}

/** Pre-built skeleton that matches a stat card layout. */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg bg-card ring-1 ring-white/[0.07] p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

/** Pre-built skeleton that matches a table row. */
function SkeletonRow({ cols = 4, className }: { cols?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 px-3 py-2.5 border-b border-white/[0.04]", className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5 flex-1"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonRow }
