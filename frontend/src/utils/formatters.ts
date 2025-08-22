export function normalizeCpf(input: string): string {
  return (input || '').replace(/\D/g, '').slice(0, 11)
}

export function formatCpf(input: string): string {
  const digits = normalizeCpf(input)
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 9),
    digits.slice(9, 11),
  ].filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length < 4)
    return [parts[0], parts[1], parts[2]].filter(Boolean).join('.')
  return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`
}

export function toIsoDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

export function fromIsoDate(date: string): Date | null {
  if (!date) return null
  const d = new Date(date)
  return isNaN(d.getTime()) ? null : d
}

export function formatDateBR(date: string | Date | null | undefined): string {
  if (!date) return ''
  let d: Date
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, dd] = date.split('-').map(Number)
      d = new Date(y, m - 1, dd)
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  return `${dd}/${mm}/${yyyy}`
}
