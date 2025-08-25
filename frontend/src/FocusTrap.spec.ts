import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from './components/Modal.vue'

describe('Modal focus trap', () => {
  it('cycles focus within modal on Tab/Shift+Tab', async () => {
    const wrap = mount(Modal, {
      props: { visible: true, title: 'Trap' },
      slots: {
        default: '<button class="a">A</button><button class="b">B</button>',
      },
      attachTo: document.body,
    })
    await wrap.vm.$nextTick()
    const panel = wrap.find('.modal')
    const first = wrap.find('button.close').element as HTMLElement
    const last = wrap.find('button.b').element as HTMLElement
    // Focus last and Tab should go to first (close button is likely first)
    last.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(document.activeElement).toBe(first)
    // Shift+Tab on first should go to last
    first.focus()
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }),
    )
    expect(document.activeElement).toBe(last)
  })
})
