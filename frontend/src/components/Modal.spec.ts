import { mount } from '@vue/test-utils'
import Modal from './Modal.vue'

describe('Modal', () => {
  it('shows and closes', async () => {
    const wrapper = mount(Modal, { props: { visible: true, title: 'Title' } })
    expect(wrapper.find('.modal').exists()).toBe(true)
    await wrapper.find('.close').trigger('click')
    expect(wrapper.emitted('update:visible')?.[0]?.[0]).toBe(false)
  })
})

