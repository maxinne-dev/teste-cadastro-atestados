import { mount } from '@vue/test-utils'
import ConfirmDialog from './ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  it('emits confirm and cancel', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { visible: true, title: 'Delete item' },
    })
    await wrapper.find('.btn.confirm').trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
    await wrapper.setProps({ visible: true })
    await wrapper.find('.btn.cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('closes on Escape key', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { visible: true, title: 'Delete item' },
    })
    const panel = wrapper.find('.dialog')
    await panel.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
