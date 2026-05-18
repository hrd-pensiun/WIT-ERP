'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  variant?: 'default' | 'warning' | 'danger' | 'success'
  className?: string
  onClick?: () => void
}

const variantStyles = {
  default: 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
  warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
  danger: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  success: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
}

const trendColors = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-zinc-500 dark:text-zinc-400',
}

export function KpiCard({ title, value, subtitle, icon, trend, trendValue, variant = 'default', className, onClick }: KpiCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border p-5 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 w-full',
        variantStyles[variant],
        onClick ? 'cursor-pointer' : 'cursor-default',
        className,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {icon && (
          <span className="text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {value}
        </span>
        {trend && trendValue && (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', trendColors[trend])}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            {trendValue}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      )}
    </button>
  )
}
