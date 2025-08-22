import { mount } from '@vue/test-utils'
import BaseInput from './BaseInput.vue'

describe('BaseInput snapshot', () => {
  it('renders input with placeholder and value', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: 'hello', placeholder: 'Type here' },
    })
    const el = wrapper.get('input.base-input')
    expect(el.attributes('type')).toBe('text')
    expect(el.attributes('placeholder')).toBe('Type here')
    expect((el.element as HTMLInputElement).value).toBe('hello')
  })
})
