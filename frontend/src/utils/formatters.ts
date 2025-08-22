export function normalizeCpf(input: string): string {
  return (input || '').replace(/\D/g, '').slice(0, 11)
}

export function formatCpf(input: string): string {
  const digits = normalizeCpf(input)
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 11)].filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length < 4) return [parts[0], parts[1], parts[2]].filter(Boolean).join('.')
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

