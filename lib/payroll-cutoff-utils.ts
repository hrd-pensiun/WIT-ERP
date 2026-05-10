/**
 * payroll-cutoff-utils.ts
 * Pure helpers for payroll cut-off date computation.
 * No React, no DB — safe in both client and server contexts.
 */

export interface CutoffConfig {
  att_cutoff_start_day: number        // e.g. 21
  att_cutoff_start_prev_month: boolean // true = hari itu di bulan sebelumnya
  att_cutoff_end_day: number           // e.g. 20
  pay_cutoff_start_day: number         // e.g. 1
  pay_cutoff_start_prev_month: boolean
  pay_cutoff_end_day: number           // 31 → last day of month
}

export interface CutoffDates {
  attStart: string  // "YYYY-MM-DD"
  attEnd: string
  payStart: string
  payEnd: string
}

/** Return the last calendar day of a given year/month (1-indexed). */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate() // month here is 1-indexed; Date uses 0-indexed
}

/**
 * Resolve a cut-off day-number to an actual "YYYY-MM-DD" date string.
 *
 * @param day         - day of month (1–31); 31 snaps to last day of that month
 * @param usePrevMonth - if true, resolve relative to month-1 of the payroll month
 * @param year        - payroll year
 * @param month       - payroll month (1-indexed)
 */
function resolveDate(day: number, usePrevMonth: boolean, year: number, month: number): string {
  let y = year
  let m = month
  if (usePrevMonth) {
    m -= 1
    if (m < 1) { m = 12; y -= 1 }
  }
  const lastDay = lastDayOfMonth(y, m)
  const d = Math.min(day, lastDay) // snap 31 → last day of that month
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

/**
 * Compute the four cut-off dates for a given payroll month.
 *
 * Example:
 *   att_cutoff_start_day=21, att_cutoff_start_prev_month=true, month=5, year=2026
 *   → attStart = "2026-04-21"
 *   att_cutoff_end_day=20, prev_month=false → attEnd = "2026-05-20"
 *   pay_cutoff_start_day=1, prev_month=false → payStart = "2026-05-01"
 *   pay_cutoff_end_day=31 → payEnd = "2026-05-31" (last day of May)
 */
export function computeCutoffDates(
  config: CutoffConfig,
  year: number,
  month: number
): CutoffDates {
  return {
    attStart: resolveDate(config.att_cutoff_start_day, config.att_cutoff_start_prev_month, year, month),
    attEnd:   resolveDate(config.att_cutoff_end_day,   false,                              year, month),
    payStart: resolveDate(config.pay_cutoff_start_day, config.pay_cutoff_start_prev_month, year, month),
    payEnd:   resolveDate(config.pay_cutoff_end_day,   false,                              year, month),
  }
}

/**
 * Count calendar days between two "YYYY-MM-DD" strings (inclusive).
 */
export function calendarDaysBetween(start: string, end: string): number {
  const a = new Date(start + "T00:00:00")
  const b = new Date(end   + "T00:00:00")
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000) + 1)
}

/**
 * Human-readable label for a cut-off config row.
 * e.g. "Tgl 21 bln lalu – Tgl 20"
 */
export function cutoffLabel(
  startDay: number,
  startPrev: boolean,
  endDay: number
): string {
  const startLabel = startPrev ? `Tgl ${startDay} bln lalu` : `Tgl ${startDay}`
  const endDayLabel = endDay >= 28 ? `Tgl akhir` : `Tgl ${endDay}`
  return `${startLabel} – ${endDayLabel}`
}
