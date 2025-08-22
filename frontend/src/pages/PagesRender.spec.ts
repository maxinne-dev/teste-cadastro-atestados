import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import router from '../router'
import App from '../App.vue'

describe('Pages render and navigation', () => {
  async function mountApp(path: string) {
    if (path !== '/login') localStorage.setItem('token', 'dev')
    await router.push(path)
    await router.isReady()
    return mount(App, { global: { plugins: [[PrimeVue, { theme: { preset: Aura } }], router] } })
  }

  it('renders Login', async () => {
    const w = await mountApp('/login')
    expect(w.text()).toContain('Entrar')
  })

  it('renders Dashboard', async () => {
    const w = await mountApp('/')
    expect(w.text()).toContain('Dashboard')
  })

  it('renders Collaborators', async () => {
    const w = await mountApp('/collaborators')
    expect(w.text()).toContain('Colaboradores')
  })

  it('renders Certificates', async () => {
    const w = await mountApp('/certificates')
    expect(w.text()).toContain('Atestados')
  })

  it('renders New Certificate', async () => {
    const w = await mountApp('/certificates/new')
    expect(w.text()).toContain('Novo Atestado')
  })

  it('renders 404', async () => {
    const w = await mountApp('/unknown')
    expect(w.text()).toContain('Página não encontrada')
  })
})

