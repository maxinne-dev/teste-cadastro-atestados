// Basic smoke test to ensure theme imports and app mount do not crash
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import './styles/tokens.css'
import './styles/theme-bridge.css'
import './styles/global.css'

describe('Theme smoke', () => {
  it('mounts root app with theme and router', async () => {
    const { getConfiguredTokenKey } = await import('./services/token')
    localStorage.setItem(getConfiguredTokenKey(), 'test')
    await router.push('/')
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
    expect(wrapper.exists()).toBe(true)
  })

  it('theme toggle switches data-theme attribute and persists', async () => {
    const { getConfiguredTokenKey } = await import('./services/token')
    localStorage.setItem(getConfiguredTokenKey(), 'test')
    await router.push('/')
    await router.isReady()
    const wrapper = mount(App, {
      attachTo: document.body,
      global: {
        plugins: [
          [PrimeVue, { theme: { preset: Aura } }],
          router,
          createPinia(),
        ],
      },
    })
    const toggle = wrapper.find('button[title^="Tema:"]')
    expect(toggle.exists()).toBe(true)
    // Ensure initial theme applied from localStorage if any
    document.documentElement.removeAttribute('data-theme')
    await toggle.trigger('click')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    await toggle.trigger('click')
    expect(document.documentElement.getAttribute('data-theme')).toBe(null)
    // Persisted state applied on next mount
    localStorage.setItem('theme', 'dark')
    mount(App, {
      attachTo: document.body,
      global: {
        plugins: [
          [PrimeVue, { theme: { preset: Aura } }],
          router,
          createPinia(),
        ],
      },
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
