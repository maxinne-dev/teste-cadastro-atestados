import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import NewCertificate from './NewCertificate.vue'

// Mock ICD search service to control results
vi.mock('./services/icd', () => ({
  search: vi.fn(async (term: string) => {
    return term ? [{ code: 'A01', title: 'Typhoid fever' }] : []
  }),
}))

describe('ICD autocomplete', () => {
  it('debounces input and renders results', async () => {
    vi.useFakeTimers()
    const wrap = mount(NewCertificate, { global: { plugins: [createPinia()] } })
    const input = wrap.find('#icd')
    await input.setValue('ty') // length >= 2 triggers search after debounce
    // Advance debounce timer (300ms) and flush
    await vi.advanceTimersByTimeAsync(350)
    // Allow any pending promises to resolve
    await Promise.resolve()
    // Suggestions container should exist with one result
    const sugg = wrap.findAll('.sugg')
    expect(sugg.length).toBeGreaterThan(0)
    expect(wrap.text()).toContain('A01 — Typhoid fever')
    vi.useRealTimers()
  })
})
