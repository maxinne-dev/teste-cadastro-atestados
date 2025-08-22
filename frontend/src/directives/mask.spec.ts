import { mount } from '@vue/test-utils'
import { mask } from './mask'

const Host = {
  template: '<input v-mask="\'cpf\'" />',
}

describe('mask directive', () => {
  it('formats cpf as user types', async () => {
    const wrapper = mount(Host, { global: { directives: { mask } } })
    const input = wrapper.find('input')
    await input.setValue('52998224725')
    expect((input.element as HTMLInputElement).value).toBe('529.982.247-25')
  })
})

