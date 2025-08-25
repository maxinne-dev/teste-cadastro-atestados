import { defineStore } from 'pinia'
import * as authApi from '../services/auth'
import { getToken as getStoredToken, setToken as persistToken } from '../services/token'

type User = { email: string; roles: string[] } | null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Prefer configured key via centralized util (legacy fallback logs warning)
    token:
      (typeof localStorage !== 'undefined' && getStoredToken()) ||
      (null as string | null),
    user: null as User,
  }),
  getters: {
    isAuthed: (s) => !!s.token,
  },
  actions: {
    async loginDummy(email: string) {
      // Back-compat for tests; route through real login with test password
      return this.login(email, 'test')
    },
    async login(email: string, password: string) {
      const { accessToken } = await authApi.login({ email, password })
      this.token = accessToken
      // Persist using centralized helper to keep keys consistent
      if (typeof localStorage !== 'undefined') persistToken(accessToken)
      this.user = { email, roles: [] }
    },
    async logout() {
      await authApi.logout()
      this.token = null
      this.user = null
    },
  },
})
