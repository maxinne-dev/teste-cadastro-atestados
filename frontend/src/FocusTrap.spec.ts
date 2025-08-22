import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from './components/Modal.vue'

describe('Modal focus trap', () => {
  it('cycles focus within modal on Tab/Shift+Tab', async () => {
    const wrap = mount(Modal, {
      props: { visible: true, title: 'Trap' },
      slots: { default: '<button class="a">A</button><button class="b">B</button>' },
      attachTo: document.body,
    })
    await wrap.vm.$nextTick()
    const panel = wrap.find('.modal')
    const focusables = panel.element.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    const first = focusables[0] as HTMLElement
    const last = focusables[focusables.length - 1] as HTMLElement
    // Focus last and Tab should go to first (close button is likely first)
    last.focus()
    await panel.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(first)
    // Shift+Tab on first should go to last
    first.focus()
    await panel.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })
})
