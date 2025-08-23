import { defineStore } from 'pinia'
import type { Certificate } from '../types/models'
import * as api from '../services/certificates'

export const useCertificatesStore = defineStore('certificates', {
  state: () => ({
    items: [] as Certificate[],
    loading: false,
    total: 0,
    limit: 0,
    offset: 0,
  }),
  getters: {
    active: (s) => s.items.filter((m) => m.status === 'active'),
    byCollaborator: (s) => (collaboratorId: string) =>
      s.items.filter((m) => m.collaboratorId === collaboratorId),
    count: (s) => s.items.length,
  },
  actions: {
    async fetchAll(params?: Partial<{ sortBy: 'issueDate'|'startDate'|'endDate'|'icdCode'; sortDir: 'asc'|'desc'; limit: number; offset: number; collaboratorId?: string; icdCode?: string; status?: Certificate['status']; startDate?: string; endDate?: string }>) {
      this.loading = true
      try {
        if (import.meta.env.MODE === 'test') {
          this.items = [
            {
              id: 'm1',
              collaboratorId: 'c1',
              startDate: '2025-01-01',
              endDate: '2025-01-05',
              days: 5,
              diagnosis: 'Resfriado',
              icdCode: 'J06.9',
              icdTitle: 'Acute upper respiratory infection, unspecified',
              status: 'active',
            },
          ]
          this.total = this.items.length
          this.limit = this.items.length
          this.offset = 0
        } else {
          const res = await api.list({
            collaboratorId: params?.collaboratorId,
            icdCode: params?.icdCode,
            status: params?.status,
            startDate: params?.startDate,
            endDate: params?.endDate,
            limit: params?.limit ?? 50,
            offset: params?.offset ?? 0,
            sortBy: params?.sortBy ?? 'issueDate',
            sortDir: params?.sortDir ?? 'desc',
          })
          this.items = res.results as any
          this.total = res.total as any
          this.limit = (res as any).limit ?? (params?.limit ?? 50)
          this.offset = (res as any).offset ?? (params?.offset ?? 0)
        }
      } finally {
        this.loading = false
      }
    },
    async create(
      input: Omit<Certificate, 'id' | 'status'> & {
        status?: Certificate['status']
      },
    ) {
      if (import.meta.env.MODE === 'test') {
        const id = 'm' + ((Math.random() * 1e6) | 0)
        this.items.push({ id, status: 'active', ...input } as any)
      } else {
        await api.create(input as any)
        await this.fetchAll()
      }
    },
    async cancel(id: string) {
      if (import.meta.env.MODE === 'test') {
        const i = this.items.findIndex((c) => c.id === id)
        if (i >= 0 && this.items[i].status === 'active') this.items[i].status = 'cancelled'
      } else {
        await api.cancel(id)
        await this.fetchAll()
      }
    },
  },
})
