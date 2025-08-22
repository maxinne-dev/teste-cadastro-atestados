import { defineStore } from 'pinia'
import type { Collaborator } from '../mocks/data'
import {
  listCollaborators,
  addOrUpdateCollaborator,
  toggleCollaboratorStatus,
} from '../mocks/data'

export const useCollaboratorsStore = defineStore('collaborators', {
  state: () => ({
    items: [] as Collaborator[],
    loading: false,
  }),
  getters: {
    activeCount: (s) => s.items.filter((c) => c.status === 'active').length,
    byId: (s) => (id: string) => s.items.find((c) => c.id === id),
  },
  actions: {
    async fetchAll() {
      this.loading = true
      await new Promise((r) => setTimeout(r, 50))
      this.items = listCollaborators()
      this.loading = false
    },
    async save(collab: Collaborator) {
      await new Promise((r) => setTimeout(r, 30))
      addOrUpdateCollaborator(collab)
      this.items = listCollaborators()
    },
    async toggleStatus(id: string) {
      await new Promise((r) => setTimeout(r, 20))
      toggleCollaboratorStatus(id)
      this.items = listCollaborators()
    },
  },
})
