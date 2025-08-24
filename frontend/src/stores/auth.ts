import { defineStore } from 'pinia'
import { isApiEnabled } from '../services/http'
import * as authApi from '../services/auth'

type User = { email: string; roles: string[] } | null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token:
      (typeof localStorage !== 'undefined' && localStorage.getItem('token')) ||
      (null as string | null),
    user: null as User,
  }),
  getters: {
    isAuthed: (s) => !!s.token,
  },
  actions: {
    async loginDummy(email: string) {
      // Back-compat for tests expecting a dummy login
      return this.login(email, 'test')
    },
    async login(email: string, password: string) {
      if (isApiEnabled()) {
        const { accessToken } = await authApi.login({ email, password })
        this.token = accessToken
        if (typeof localStorage !== 'undefined')
          localStorage.setItem('token', this.token)
        this.user = { email, roles: [] }
      } else {
        await new Promise((r) => setTimeout(r, 50))
        this.token = 'dev'
        if (typeof localStorage !== 'undefined')
          localStorage.setItem('token', this.token)
        this.user = { email, roles: ['hr'] }
      }
    },
    async logout() {
      if (isApiEnabled()) await authApi.logout()
      else await new Promise((r) => setTimeout(r, 10))
      this.token = null
      if (typeof localStorage !== 'undefined') localStorage.removeItem('token')
      this.user = null
    },
  },
})
