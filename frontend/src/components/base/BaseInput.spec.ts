import { mount } from '@vue/test-utils'
import BaseInput from './BaseInput.vue'

describe('BaseInput', () => {
  it('emits model updates', async () => {
    const wrapper = mount(BaseInput, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('hello')
    const emits = wrapper.emitted('update:modelValue')
    expect(emits?.[0]?.[0]).toBe('hello')
  })
})
