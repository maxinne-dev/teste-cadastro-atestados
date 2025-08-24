import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'
import Collaborators from './Collaborators.vue'
import { useCollaboratorsStore } from './stores/collaborators'

describe('E2E UI Smoke: Duplicate CPF surfaced as toast', () => {
  it('shows 409 duplicate CPF error toast on save', async () => {
    const pinia = createPinia()
    const wrap = mount(
      { components: { Toast, Collaborators }, template: '<div><Toast /><Collaborators /></div>' },
      {
        attachTo: document.body,
        global: { plugins: [[PrimeVue, { theme: { preset: Aura } }], ToastService, pinia] },
      },
    )
    const store = useCollaboratorsStore()
    // Open create dialog
    await wrap.find('button.btn.primary').trigger('click')
    // Fill fields
    await wrap.find('#fullName').setValue('Teste')
    await wrap.find('#cpf').setValue('39053344705')
    await wrap.find('#birth').setValue('1990-01-01')
    await wrap.find('#position').setValue('Dev')
    await wrap.find('#department').setValue('TI')
    // Stub save to reject with 409 shape our UI handles
    store.save = (async () => {
      const err: any = new Error('Duplicate')
      err.status = 409
      throw err
    }) as any
    // Submit
    await wrap.find('form').trigger('submit')
    await wrap.vm.$nextTick()
    // Toast is teleported to body; assert message appears
    expect(document.body.textContent || '').toMatch(/CPF já cadastrado/i)
  })
})

