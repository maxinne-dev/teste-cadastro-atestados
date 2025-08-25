import {
  formatCpf,
  normalizeCpf,
  toIsoDate,
  fromIsoDate,
  formatDateBR,
} from './formatters'

describe('formatters', () => {
  it('normalizes and formats CPF', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725')
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
  })

  it('handles dates', () => {
    const iso = toIsoDate('2025-01-02')
    expect(iso).toBe('2025-01-02')
    const d = fromIsoDate('2025-01-02')
    expect(d).not.toBeNull()
    expect(formatDateBR('2025-01-02')).toBe('02/01/2025')
  })
})
