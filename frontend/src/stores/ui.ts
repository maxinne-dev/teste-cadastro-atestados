import { defineStore } from 'pinia'

type Theme = 'light' | 'dark' | 'system'

export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: ((typeof localStorage !== 'undefined' &&
      (localStorage.getItem('theme') as Theme)) ||
      'system') as Theme,
    sidebarCollapsed:
      (typeof localStorage !== 'undefined' &&
        localStorage.getItem('sidebar:collapsed') === 'true') ||
      false,
  }),
  actions: {
    setTheme(t: Theme) {
      this.theme = t
      if (typeof localStorage !== 'undefined') localStorage.setItem('theme', t)
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      if (typeof localStorage !== 'undefined')
        localStorage.setItem('sidebar:collapsed', String(this.sidebarCollapsed))
    },
  },
})
