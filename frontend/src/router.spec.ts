import router from './router'

describe('router', () => {
  it('has a login route', () => {
    expect(router.hasRoute('login')).toBe(true)
  })
})

