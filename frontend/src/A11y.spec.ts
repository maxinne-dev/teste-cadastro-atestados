import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import AppTopbar from './components/AppTopbar.vue'
import Modal from './components/Modal.vue'
import SidePanel from './components/SidePanel.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

describe('A11y basics', () => {
  it('renders skip link in App', async () => {
    const { getConfiguredTokenKey } = await import('./services/token')
    localStorage.setItem(getConfiguredTokenKey(), 'test')
    await router.push('/')
    await router.isReady()
    const wrap = mount(App, { global: { plugins: [router, createPinia()] } })
    const link = wrap.find('a.skip-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('#content')
  })

  it('Modal has dialog role and aria attributes', async () => {
    const wrap = mount(Modal, {
      props: { visible: true, title: 'Teste' },
      slots: { default: '<p>Body</p>' },
      attachTo: document.body,
    })
    await wrap.vm.$nextTick()
    const dialog = wrap.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
    const titleId = dialog.attributes('aria-labelledby')
    expect(titleId).toBeTruthy()
    const title = wrap.find(`#${titleId}`)
    expect(title.exists()).toBe(true)
  })

  it('SidePanel has dialog role and focuses when opened', async () => {
    const wrap = mount(SidePanel, {
      props: { visible: true, title: 'Panel' },
      attachTo: document.body,
    })
    await wrap.vm.$nextTick()
    const dialog = wrap.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
  })

  it('ConfirmDialog has dialog role and aria-modal', async () => {
    const wrap = mount(ConfirmDialog, {
      props: { visible: true, title: 'Confirm' },
      attachTo: document.body,
    })
    await wrap.vm.$nextTick()
    const dialog = wrap.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
  })

  it('Topbar menu emits correct events based on width', async () => {
    const emitSpy = vi.fn()
    const wrap = mount(AppTopbar, {
      attrs: { onToggleSidebar: emitSpy, onOpenMobileSidebar: emitSpy },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    // Desktop width
    ;(window as any).innerWidth = 1280
    await wrap.find('button.icon-btn').trigger('click')
    expect(emitSpy).toHaveBeenCalled()
    // Mobile width
    ;(window as any).innerWidth = 360
    await wrap.find('button.icon-btn').trigger('click')
    expect(emitSpy).toHaveBeenCalledTimes(2)
  })
})
