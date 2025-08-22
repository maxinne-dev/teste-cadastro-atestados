import { mount } from '@vue/test-utils'
import BaseInput from './BaseInput.vue'

describe('BaseInput snapshot', () => {
  it('matches markup', () => {
    const wrapper = mount(BaseInput, { props: { modelValue: 'hello', placeholder: 'Type here' } })
    expect(wrapper.html()).toMatchInlineSnapshot(
      `
      <input class="base-input" type="text" placeholder="Type here" value="hello">
      `,
    )
  })
})

