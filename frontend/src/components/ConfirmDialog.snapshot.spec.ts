import { mount } from '@vue/test-utils'
import ConfirmDialog from './ConfirmDialog.vue'

describe('ConfirmDialog snapshot', () => {
  it('matches open dialog markup', () => {
    const wrapper = mount(ConfirmDialog, { props: { visible: true, title: 'Confirmar', message: 'Deseja continuar?' } })
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="backdrop">
        <div class="dialog neutral" tabindex="-1" role="dialog" aria-modal="true">
          <h3 class="title">Confirmar</h3>
          <p class="message">Deseja continuar?</p>
          <div class="actions"><button class="btn cancel">Cancelar</button><button class="btn confirm">Confirmar</button></div>
        </div>
      </div>
    `)
  })
})

