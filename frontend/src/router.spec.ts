import router from './router'

async function resetAuth() {
  localStorage.removeItem('token')
}

describe('router', () => {
  it('has a login route', () => {
    expect(router.hasRoute('login')).toBe(true)
  })

  it('redirects unauthenticated to login for protected routes', async () => {
    await resetAuth()
    await router.push('/certificates')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('allows navigation when authenticated', async () => {
    localStorage.setItem('token', 'dev')
    await router.push('/certificates')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('certificates')
  })

  it('has 404 route', () => {
    expect(router.hasRoute('not-found')).toBe(true)
  })
})
