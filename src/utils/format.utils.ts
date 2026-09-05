/**
 * Formats a leave value (days or hours) rounded to at most 2 decimal places,
 * without unnecessary trailing zeros (e.g. 6 -> "6", 6.5 -> "6.5", 7.3455 -> "7.35").
 */
export function formatLeaveDays(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0'
  const rounded = Math.round(Number(val) * 100) / 100
  return rounded.toString()
}
