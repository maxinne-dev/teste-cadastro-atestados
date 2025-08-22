import { defineStore } from 'pinia'
import type { Certificate } from '../mocks/data'
import { listCertificates, addCertificate, cancelCertificate } from '../mocks/data'

export const useCertificatesStore = defineStore('certificates', {
  state: () => ({
    items: [] as Certificate[],
    loading: false,
  }),
  getters: {
    active: (s) => s.items.filter((m) => m.status === 'active'),
    byCollaborator: (s) => (collaboratorId: string) => s.items.filter((m) => m.collaboratorId === collaboratorId),
    count: (s) => s.items.length,
  },
  actions: {
    async fetchAll() {
      this.loading = true
      await new Promise((r) => setTimeout(r, 50))
      this.items = listCertificates()
      this.loading = false
    },
    async create(input: Omit<Certificate, 'id' | 'status'> & { status?: Certificate['status'] }) {
      await new Promise((r) => setTimeout(r, 40))
      addCertificate(input)
      this.items = listCertificates()
    },
    async cancel(id: string) {
      await new Promise((r) => setTimeout(r, 20))
      cancelCertificate(id)
      this.items = listCertificates()
    },
  },
})

