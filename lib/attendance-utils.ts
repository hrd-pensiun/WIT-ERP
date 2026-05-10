/**
 * attendance-utils.ts
 * Pure helper functions for attendance calculations.
 * No React, no hooks — safe to use in both client and server code.
 */

/**
 * Determine check-in status against a shift schedule.
 *
 * @param checkIn     - actual check-in as Date (local time)
 * @param shiftStart  - shift start_time string, e.g. "08:00:00"
 * @param gracePeriod - tolerance in minutes (default 15)
 */
export function computeCheckInStatus(
  checkIn: Date,
  shiftStart: string,
  gracePeriod: number = 15
): "on_time" | "late" {
  const [h, m, s] = shiftStart.split(":").map(Number)
  // Build a Date on the same calendar day as checkIn
  const shiftDate = new Date(checkIn)
  shiftDate.setHours(h, m, s ?? 0, 0)

  const deadline = new Date(shiftDate.getTime() + gracePeriod * 60 * 1000)
  return checkIn <= deadline ? "on_time" : "late"
}

/**
 * Count the number of minutes late.
 * Returns 0 if on time or early.
 */
export function lateMinutes(
  checkIn: Date,
  shiftStart: string,
  gracePeriod: number = 15
): number {
  const [h, m, s] = shiftStart.split(":").map(Number)
  const shiftDate = new Date(checkIn)
  shiftDate.setHours(h, m, s ?? 0, 0)
  const deadline = new Date(shiftDate.getTime() + gracePeriod * 60 * 1000)
  return Math.max(0, Math.floor((checkIn.getTime() - deadline.getTime()) / 60000))
}

/**
 * Count working days between two date strings (inclusive), excluding weekends
 * and a pre-fetched list of holiday dates.
 *
 * @param start    - "YYYY-MM-DD"
 * @param end      - "YYYY-MM-DD"
 * @param holidays - array of holiday date strings "YYYY-MM-DD"
 */
export function countWorkingDaysWithHolidays(
  start: string,
  end: string,
  holidays: string[] = []
): number {
  const holidaySet = new Set(holidays)
  let count = 0
  const current = new Date(start + "T00:00:00")
  const endDate = new Date(end + "T00:00:00")

  while (current <= endDate) {
    const dow = current.getDay()             // 0=Sun 6=Sat
    const dateStr = current.toISOString().slice(0, 10)
    if (dow !== 0 && dow !== 6 && !holidaySet.has(dateStr)) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  return count
}

/**
 * Format a "HH:MM:SS" time string to "HH:MM" for display.
 */
export function formatTime(t: string): string {
  return t?.slice(0, 5) ?? ""
}
