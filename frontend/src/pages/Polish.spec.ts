import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import router from '../router'
import App from '../App.vue'

describe('Polished UX', () => {
  it('shows EmptyState on Collaborators when no matches', async () => {
    localStorage.setItem('token', 'dev')
    await router.push('/collaborators')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [[PrimeVue, { theme: { preset: Aura } }], router] } })
    // type a rare string into search input
    const input = wrapper.find('input[placeholder="Buscar nome ou CPF"]')
    await input.setValue('zzzzzz')
    expect(wrapper.text()).toContain('Nenhum colaborador')
  })

  it('shows Banner on New Certificate when invalid submit', async () => {
    localStorage.setItem('token', 'dev')
    await router.push('/certificates/new')
    await router.isReady()
    const wrapper = mount(App, { attachTo: document.body, global: { plugins: [[PrimeVue, { theme: { preset: Aura } }], router] } })
    await wrapper.find('button[type="submit"]').trigger('click')
    await nextTick()
    expect(wrapper.find('.banner').exists()).toBe(true)
  })
})
