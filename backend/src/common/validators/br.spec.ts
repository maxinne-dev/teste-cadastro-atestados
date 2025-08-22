import { normalizeCpf, isValidCpf } from './br'

describe('BR validators', () => {
  it('normalizeCpf strips non-digits', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725')
    expect(normalizeCpf('  529 982 247 25 ')).toBe('52998224725')
    expect(normalizeCpf('')).toBe('')
    expect(normalizeCpf(undefined)).toBe('')
  })

  it('isValidCpf validates correct CPFs', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('111.444.777-35')).toBe(true)
  })

  it('isValidCpf rejects invalid CPFs', () => {
    expect(isValidCpf('123.456.789-00')).toBe(false)
    expect(isValidCpf('000.000.000-00')).toBe(false)
    expect(isValidCpf('52998224724')).toBe(false) // wrong check digits
    expect(isValidCpf('5299822472')).toBe(false) // too short
  })
})

