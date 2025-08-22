// Basic smoke test to ensure theme imports and app mount do not crash
import { mount } from '@vue/test-utils'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import './styles/tokens.css'
import './styles/theme-bridge.css'
import './styles/global.css'

describe('Theme smoke', () => {
  it('mounts root app with theme and router', async () => {
    localStorage.setItem('token', 'dev')
    await router.push('/')
    await router.isReady()
    const wrapper = mount(App, {
      global: {
        plugins: [[PrimeVue, { theme: { preset: Aura } }], router],
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('theme toggle switches data-theme attribute', async () => {
    localStorage.setItem('token', 'dev')
    await router.push('/')
    await router.isReady()
    const wrapper = mount(App, {
      attachTo: document.body,
      global: {
        plugins: [[PrimeVue, { theme: { preset: Aura } }], router],
      },
    })
    const toggle = wrapper.find('button[title^="Theme:"]')
    expect(toggle.exists()).toBe(true)
    // Ensure initial theme applied from localStorage if any
    document.documentElement.removeAttribute('data-theme')
    await toggle.trigger('click')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    await toggle.trigger('click')
    expect(document.documentElement.getAttribute('data-theme')).toBe(null)
  })
})

