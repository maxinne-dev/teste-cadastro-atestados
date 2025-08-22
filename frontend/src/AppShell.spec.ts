import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import router from './router'
import App from './App.vue'

// Import global styles/tokens to ensure variables exist (no-ops in jsdom)
import './styles/tokens.css'
import './styles/theme-bridge.css'
import './styles/global.css'

describe('App Shell & Layout', () => {
  beforeEach(async () => {
    localStorage.setItem('token', 'dev')
    // Ensure desktop width for sidebar toggle
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
    if (!router.hasRoute('dashboard')) {
      // router imported from src/router already has routes
    }
    await router.push('/')
    await router.isReady()
  })

  it('renders AppLayout with Dashboard title via route meta', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [[PrimeVue, { theme: { preset: Aura } }], router],
      },
    })

    expect(wrapper.html()).toContain('Dashboard')
    // app-shell container should exist when authenticated routes are active
    expect(wrapper.find('.app-shell').exists()).toBe(true)
  })

  it('toggles sidebar collapsed class when clicking menu on desktop', async () => {
    const wrapper = mount(App, {
      attachTo: document.body,
      global: {
        plugins: [[PrimeVue, { theme: { preset: Aura } }], router],
      },
    })

    const before = wrapper.find('.app-shell')
    expect(before.classes()).not.toContain('sidebar-collapsed')

    // Find the hamburger button (aria-label="Open menu") and click
    const btn = wrapper.find('button[aria-label="Open menu"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')

    const after = wrapper.find('.app-shell')
    expect(after.classes()).toContain('sidebar-collapsed')
  })
})
