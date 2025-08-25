import { mount } from '@vue/test-utils'
import ConfirmDialog from './ConfirmDialog.vue'

describe('ConfirmDialog snapshot', () => {
  it('renders open dialog with title, message and actions', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: 'Confirmar',
        message: 'Deseja continuar?',
      },
    })
    expect(wrapper.find('.backdrop').exists()).toBe(true)
    expect(wrapper.find('.dialog').attributes('role')).toBe('dialog')
    expect(wrapper.find('.title').text()).toBe('Confirmar')
    expect(wrapper.find('.message').text()).toBe('Deseja continuar?')
    const actions = wrapper.findAll('.actions .btn')
    expect(actions.length).toBe(2)
    expect(actions[0].text()).toBe('Cancelar')
    expect(actions[1].text()).toBe('Confirmar')
  })
})
