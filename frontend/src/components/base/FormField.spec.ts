import { mount } from '@vue/test-utils'
import FormField from './FormField.vue'

describe('FormField', () => {
  it('renders label, hint and errors', () => {
    const wrapper = mount(FormField, {
      props: { label: 'Email', hint: 'Use corporate email', error: ['Required', 'Invalid format'], for: 'email' },
      slots: { default: '<input id="email" />' },
    })
    expect(wrapper.text()).toContain('Email')
    expect(wrapper.text()).toContain('Use corporate email')
    expect(wrapper.text()).toContain('Required')
    expect(wrapper.text()).toContain('Invalid format')
  })
})

