import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppLayout from './layouts/AppLayout.vue'
import AppTopbar from './components/AppTopbar.vue'

// Stub PrimeVue Sidebar to expose v-model:visible via attribute
vi.mock('primevue/sidebar', () => {
  return {
    default: {
      name: 'StubSidebar',
      props: { visible: { type: Boolean, default: false } },
      emits: ['update:visible'],
      template: '<div class="stub-sidebar" :data-visible="String(visible)"><slot /></div>',
    },
  }
})

const routes = [
  { path: '/', name: 'dashboard', component: { template: '<div>Home</div>' }, meta: { title: 'Dashboard' } },
]

function makeRouter() {
  const router = createRouter({ history: createMemoryHistory(), routes })
  return router
}

describe('Viewport behavior (sidebar + layout)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  async function mountLayout() {
    const router = makeRouter()
    await router.isReady()
    const wrap = mount(AppLayout, { global: { plugins: [router] }, attachTo: document.body })
    return wrap
  }

  it('360px: clicking menu opens mobile sidebar overlay', async () => {
    ;(window as any).innerWidth = 360
    const wrap = await mountLayout()
    await wrap.vm.$nextTick()
    // Click menu button in topbar
    const btn = wrap.find('.app-topbar .icon-btn')
    await btn.trigger('click')
    const stub = wrap.find('.stub-sidebar')
    expect(stub.attributes('data-visible')).toBe('true')
  })

  it('768px: clicking menu opens mobile sidebar overlay', async () => {
    ;(window as any).innerWidth = 768
    const wrap = await mountLayout()
    const btn = wrap.find('.app-topbar .icon-btn')
    await btn.trigger('click')
    const stub = wrap.find('.stub-sidebar')
    expect(stub.attributes('data-visible')).toBe('true')
  })

  it('1024px: clicking menu toggles collapsed class (desktop)', async () => {
    ;(window as any).innerWidth = 1024
    const wrap = await mountLayout()
    const shell = wrap.find('.app-shell')
    expect(shell.classes()).not.toContain('sidebar-collapsed')
    const btn = wrap.find('.app-topbar .icon-btn')
    await btn.trigger('click')
    expect(shell.classes()).toContain('sidebar-collapsed')
  })

  it('1280px: clicking menu toggles collapsed class (desktop)', async () => {
    ;(window as any).innerWidth = 1280
    const wrap = await mountLayout()
    const shell = wrap.find('.app-shell')
    expect(shell.classes()).not.toContain('sidebar-collapsed')
    const btn = wrap.find('.app-topbar .icon-btn')
    await btn.trigger('click')
    expect(shell.classes()).toContain('sidebar-collapsed')
  })
})

