import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import router from './router'
import NewCertificate from './NewCertificate.vue'
import { useCertificatesStore } from './stores/certificates'

describe('Mock data updates visible', () => {
  it('creating certificate updates store items', async () => {
    const pinia = createPinia()
    const wrap = mount(NewCertificate, {
      global: { plugins: [pinia, router] },
      attachTo: document.body,
    })
    const store = useCertificatesStore()
    const before = store.items.length
    // Set valid form values via component instance
    ;(wrap.vm as any).form.collaboratorId = 'c1'
    ;(wrap.vm as any).form.startDate = '2025-05-10'
    ;(wrap.vm as any).form.endDate = '2025-05-12'
    ;(wrap.vm as any).form.days = 3
    ;(wrap.vm as any).form.diagnosis = 'Teste'
    ;(wrap.vm as any).form.icdCode = 'J06.9'
    ;(wrap.vm as any).form.icdTitle = 'Test ICD'
    ;(wrap.vm as any).daysStr = '3'
    await wrap.vm.$nextTick()
    await wrap.find('form').trigger('submit.prevent')
    // allow action promise to resolve
    await new Promise((r) => setTimeout(r, 60))
    const after = store.items.length
    expect(after).toBeGreaterThanOrEqual(before + 1)
  })
})
