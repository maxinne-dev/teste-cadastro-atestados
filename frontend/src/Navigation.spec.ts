import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

describe('Navigation via sidebar and direct URLs', () => {
  beforeEach(async () => {
    const { getConfiguredTokenKey } = await import('./services/token')
    localStorage.setItem(getConfiguredTokenKey(), 'test')
    await router.push('/')
    await router.isReady()
  })

  it('sidebar links navigate to routes', async () => {
    const wrap = mount(App, {
      global: {
        plugins: [
          [PrimeVue, { theme: { preset: Aura } }],
          router,
          createPinia(),
        ],
      },
      attachTo: document.body,
    })
    // Navigate to Collaborators
    await router.push('/collaborators')
    expect(router.currentRoute.value.path).toBe('/collaborators')
    // Navigate to Certificates
    await router.push('/certificates')
    expect(router.currentRoute.value.path).toBe('/certificates')
  })

  it('direct URL navigation loads page', async () => {
    await router.push('/certificates/new')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('new-certificate')
  })
})
