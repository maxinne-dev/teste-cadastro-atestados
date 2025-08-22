import { defineStore } from 'pinia'

type User = { email: string; roles: string[] } | null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || null as string | null,
    user: null as User,
  }),
  getters: {
    isAuthed: (s) => !!s.token,
  },
  actions: {
    async loginDummy(email: string, _password: string) {
      await new Promise((r) => setTimeout(r, 50))
      this.token = 'dev'
      if (typeof localStorage !== 'undefined') localStorage.setItem('token', this.token)
      this.user = { email, roles: ['hr'] }
    },
    async logout() {
      await new Promise((r) => setTimeout(r, 10))
      this.token = null
      if (typeof localStorage !== 'undefined') localStorage.removeItem('token')
      this.user = null
    },
  },
})

