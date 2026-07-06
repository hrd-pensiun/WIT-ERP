/**
 * FilterBar — standard toolbar for search/filter controls.
 * Usage:
 *   <FilterBar>
 *     <FilterBarSearch value={q} onChange={setQ} />
 *     <FilterBarSeparator />
 *     <Select><SelectTrigger size="sm" className="w-auto min-w-[140px]">…</SelectTrigger></Select>
 *     <FilterBarActions>
 *       <Button variant="outline" size="sm">…</Button>
 *     </FilterBarActions>
 *   </FilterBar>
 */
import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

function FilterBar({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-bar"
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function FilterBarSearch({
  className,
  placeholder = "Cari...",
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative flex-1 min-w-[180px] max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        data-slot="filter-bar-search"
        placeholder={placeholder}
        className={cn(
          "h-8 pl-8 text-sm bg-muted/50 border-border focus-visible:bg-background",
          className
        )}
        {...props}
      />
    </div>
  )
}

function FilterBarSeparator({ className }: { className?: string }) {
  return (
    <div
      data-slot="filter-bar-separator"
      className={cn("hidden h-4 w-px bg-border sm:block", className)}
    />
  )
}

function FilterBarActions({ className, children }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-bar-actions"
      className={cn("ml-auto flex items-center gap-2", className)}
    >
      {children}
    </div>
  )
}

export { FilterBar, FilterBarSearch, FilterBarSeparator, FilterBarActions }
