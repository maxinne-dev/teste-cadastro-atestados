// Basic frontend validators to mirror backend DTOs where feasible

export function isValidCpf(input: string): boolean {
  // Validate Brazilian CPF with checksum
  const cpf = (input || '').replace(/\D/g, '')
  if (!cpf || cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false // repeated digits
  const calcCheck = (base: string, factor: number) => {
    let sum = 0
    for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factor - i)
    const mod = (sum * 10) % 11
    return mod === 10 ? 0 : mod
  }
  const d1 = calcCheck(cpf.slice(0, 9), 10)
  const d2 = calcCheck(cpf.slice(0, 10), 11)
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10])
}

export function isNonEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

export function isValidIsoDate(v: string | null | undefined): boolean {
  if (!v) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const d = new Date(v)
  return !isNaN(d.getTime())
}

