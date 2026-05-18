'use client'

import { cn } from '@/lib/utils'

interface AllocationSegment {
  label: string
  percentage: number
  color: string
}

interface AllocationBarProps {
  segments: AllocationSegment[]
  total: number
  size?: 'sm' | 'md'
  showLabel?: boolean
}

const barColors = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-teal-500',
]

export function AllocationBar({ segments, total, size = 'md', showLabel = true }: AllocationBarProps) {
  const statusColor = total > 100 ? 'bg-red-500' : total > 90 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className="space-y-1.5">
      <div className={cn('flex rounded-full overflow-hidden', size === 'sm' ? 'h-2' : 'h-3')}>
        {segments.map((seg, i) => (
          <div
            key={i}
            className={cn(seg.color || barColors[i % barColors.length], 'transition-all')}
            style={{ width: `${Math.min(seg.percentage, 100)}%` }}
            title={`${seg.label}: ${seg.percentage}%`}
          />
        ))}
        {total > 100 && (
          <div
            className="bg-red-500"
            style={{ width: `${Math.min(total - 100, 100)}%` }}
            title={`Over: ${total - 100}%`}
          />
        )}
      </div>
      <div className={cn('flex justify-between items-center', size === 'sm' ? 'text-[0.65rem]' : 'text-xs')}>
        {showLabel && (
          <div className="flex gap-2 flex-wrap">
            {segments.map((seg, i) => (
              <span key={i} className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                <span className={cn('w-1.5 h-1.5 rounded-full', seg.color || barColors[i % barColors.length])} />
                {seg.label} {seg.percentage}%
              </span>
            ))}
          </div>
        )}
        <span className={cn(
          'font-medium tabular-nums',
          total > 100 ? 'text-red-600 dark:text-red-400' :
          total > 90 ? 'text-amber-600 dark:text-amber-400' :
          'text-zinc-600 dark:text-zinc-300'
        )}>
          {total}%
        </span>
      </div>
    </div>
  )
}

interface UtilizationDotProps {
  rate: number
  size?: 'sm' | 'md'
}

export function UtilizationDot({ rate, size = 'sm' }: UtilizationDotProps) {
  const color = rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-blue-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <span className={cn('inline-block rounded-full', color, size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5')} />
  )
}
