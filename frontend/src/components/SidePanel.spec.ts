import { mount } from '@vue/test-utils'
import SidePanel from './SidePanel.vue'

describe('SidePanel', () => {
  it('shows and hides via v-model', async () => {
    const wrapper = mount(SidePanel, {
      props: { visible: false, title: 'Panel' },
    })
    expect(wrapper.find('.panel').exists()).toBe(false)
    await wrapper.setProps({ visible: true })
    expect(wrapper.find('.panel').exists()).toBe(true)
    await wrapper.find('button.close').trigger('click')
    expect(wrapper.emitted('update:visible')?.[0]?.[0]).toBe(false)
  })
})
