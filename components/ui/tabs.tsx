"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex items-center justify-center text-muted-foreground",
  {
    variants: {
      variant: {
        /* pill — compact selector inside a card, muted bg */
        default:
          "w-fit rounded-lg p-[3px] bg-muted group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
        /* line — full-width bottom-border nav */
        line:
          "w-full rounded-none border-b border-border bg-transparent p-0 h-auto justify-start gap-0",
        /* pill-outline — bordered segment control */
        outline:
          "w-fit rounded-lg border border-border bg-transparent p-[3px] gap-1 group-data-horizontal/tabs:h-9",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        /* ── base ── */
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
        "text-sm font-medium transition-all duration-150 outline-none select-none",
        "disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        /* ── default (pill) variant ── */
        "group-data-[variant=default]/tabs-list:h-[calc(100%-2px)] group-data-[variant=default]/tabs-list:flex-1",
        "group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:px-3",
        "group-data-[variant=default]/tabs-list:text-foreground/60",
        "group-data-[variant=default]/tabs-list:hover:text-foreground",
        "group-data-[variant=default]/tabs-list:data-active:bg-background",
        "group-data-[variant=default]/tabs-list:data-active:text-foreground",
        "group-data-[variant=default]/tabs-list:data-active:shadow-sm",
        "dark:group-data-[variant=default]/tabs-list:data-active:bg-input/30",

        /* ── line variant — underline indicator ── */
        "group-data-[variant=line]/tabs-list:px-4 group-data-[variant=line]/tabs-list:py-3",
        "group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:-mb-px",
        "group-data-[variant=line]/tabs-list:border-transparent",
        "group-data-[variant=line]/tabs-list:text-muted-foreground",
        "group-data-[variant=line]/tabs-list:hover:text-foreground",
        "group-data-[variant=line]/tabs-list:hover:border-border",
        "group-data-[variant=line]/tabs-list:data-active:border-emerald-500",
        "group-data-[variant=line]/tabs-list:data-active:text-emerald-600",
        "dark:group-data-[variant=line]/tabs-list:data-active:text-emerald-400",

        /* ── outline variant — bordered segment ── */
        "group-data-[variant=outline]/tabs-list:h-[calc(100%-2px)] group-data-[variant=outline]/tabs-list:flex-1",
        "group-data-[variant=outline]/tabs-list:rounded-md group-data-[variant=outline]/tabs-list:px-3",
        "group-data-[variant=outline]/tabs-list:text-muted-foreground",
        "group-data-[variant=outline]/tabs-list:hover:text-foreground",
        "group-data-[variant=outline]/tabs-list:data-active:bg-emerald-500/10",
        "group-data-[variant=outline]/tabs-list:data-active:text-emerald-600",
        "group-data-[variant=outline]/tabs-list:data-active:border group-data-[variant=outline]/tabs-list:data-active:border-emerald-500/30",
        "dark:group-data-[variant=outline]/tabs-list:data-active:text-emerald-400",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
