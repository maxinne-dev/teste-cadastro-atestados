import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import router from './router'
import App from './App.vue'

// Focus: attachments placeholder presence and accessible labels

describe('New Certificate attachments placeholder', () => {
  it('renders attachments placeholder section', async () => {
    const { getConfiguredTokenKey } = await import('./services/token')
    localStorage.setItem(getConfiguredTokenKey(), 'test')
    await router.push('/certificates/new')
    await router.isReady()
    const wrapper = mount(App, {
      global: {
        plugins: [
          [PrimeVue, { theme: { preset: Aura } }],
          router,
          createPinia(),
        ],
      },
    })
    expect(wrapper.find('.attachments-placeholder').exists()).toBe(true)
    expect(wrapper.text()).toContain('Anexos')
    expect(wrapper.text()).toContain('Área para anexar arquivos')
  })
})
