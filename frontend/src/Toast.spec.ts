import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'
import { useNotify } from './composables/useNotify'

const TestHost = {
  components: { Toast },
  template: '<div><Toast /><button id="go" @click="go">go</button></div>',
  setup() {
    const { notifySuccess } = useNotify()
    return { go: () => notifySuccess('Saved', 'All good', 100) }
  },
}

describe('Toast notifications', () => {
  it('shows a success toast via useNotify', async () => {
    const wrapper = mount(TestHost, {
      attachTo: document.body,
      global: {
        plugins: [[PrimeVue, { theme: { preset: Aura } }], ToastService],
      },
    })
    await wrapper.find('#go').trigger('click')
    // Toast is teleported to body; check for content
    expect(document.body.textContent).toContain('Saved')
  })
})
