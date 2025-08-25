export function daysBetweenInclusive(
  start: string | Date,
  end: string | Date,
): number {
  const s = typeof start === 'string' ? new Date(start) : start
  const e = typeof end === 'string' ? new Date(end) : end
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0
  const ms =
    new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime() -
    new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime()
  return Math.max(0, Math.round(ms / 86400000) + 1)
}

export function clampDateRange(
  start: Date,
  end: Date,
  min?: Date,
  max?: Date,
): [Date, Date] {
  let s = start
  let e = end
  if (min && s < min) s = min
  if (max && e > max) e = max
  if (e < s) e = s
  return [s, e]
}
