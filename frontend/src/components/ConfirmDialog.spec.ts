import { mount } from '@vue/test-utils'
import ConfirmDialog from './ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  it('emits confirm and cancel', async () => {
    const wrapper = mount(ConfirmDialog, { props: { visible: true, title: 'Delete item' } })
    await wrapper.find('.btn.confirm').trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
    await wrapper.setProps({ visible: true })
    await wrapper.find('.btn.cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})

