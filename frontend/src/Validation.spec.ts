import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import Login from './Login.vue'
import NewCertificate from './NewCertificate.vue'
import Collaborators from './Collaborators.vue'

describe('Form Validation (client-only)', () => {
  it('Login disables submit until valid email and password', async () => {
    const wrap = mount(Login)
    const submit = () => wrap.find('button[type="submit"]')
    expect(submit().attributes('disabled')).toBeDefined()
    await wrap.find('#email').setValue('user@company.com')
    expect(submit().attributes('disabled')).toBeDefined()
    await wrap.find('#password').setValue('secret')
    expect(submit().attributes('disabled')).toBeUndefined()
  })

  it('New Certificate enforces date order and required fields', async () => {
    const pinia = createPinia()
    const wrap = mount(NewCertificate, {
      global: { plugins: [[PrimeVue, { theme: { preset: Aura } }], pinia] },
      attachTo: document.body,
    })
    const submit = () => wrap.find('button[type="submit"]')
    expect(submit().attributes('disabled')).toBeDefined()
    // Fill collaborator and dates (invalid order)
    // Select first option by directly setting model via input
    await wrap.vm.$nextTick()
    // Directly set underlying reactive state via component proxy for simplicity
    ;(wrap.vm as any).form.collaboratorId = 'c1'
    ;(wrap.vm as any).form.startDate = '2024-05-10'
    ;(wrap.vm as any).form.endDate = '2024-05-05'
    await wrap.vm.$nextTick()
    expect(submit().attributes('disabled')).toBeDefined()
    // Fix date order
    ;(wrap.vm as any).form.endDate = '2024-05-12'
    await wrap.vm.$nextTick()
    expect(submit().attributes('disabled')).toBeUndefined()
  })

  it('Collaborators: Save disabled until required fields and valid CPF (11 digits)', async () => {
    const pinia = createPinia()
    const wrap = mount(Collaborators, { global: { plugins: [pinia] }, attachTo: document.body })
    // Open create editor
    await wrap.find('button.btn.primary').trigger('click')
    const save = () => wrap.find('button[type="submit"]')
    expect(save().attributes('disabled')).toBeDefined()
    // Fill required fields with invalid CPF
    await wrap.find('#fullName').setValue('Nome Teste')
    await wrap.find('#cpf').setValue('1234567890') // 10 digits
    await wrap.find('#birth').setValue('1990-01-01')
    await wrap.find('#position').setValue('Cargo')
    await wrap.find('#department').setValue('Depto')
    await wrap.vm.$nextTick()
    expect(save().attributes('disabled')).toBeDefined()
    // Fix CPF to 11 digits
    await wrap.find('#cpf').setValue('12345678901')
    await wrap.vm.$nextTick()
    expect(save().attributes('disabled')).toBeUndefined()
  })
})

