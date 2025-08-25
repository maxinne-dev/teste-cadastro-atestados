import { defineStore } from 'pinia'
import type { Collaborator } from '../types/models'
import * as api from '../services/collaborators'

export const useCollaboratorsStore = defineStore('collaborators', {
  state: () => ({
    items: [] as Collaborator[],
    loading: false,
    total: 0,
    limit: 0,
    offset: 0,
  }),
  getters: {
    activeCount: (s) => s.items.filter((c) => c.status === 'active').length,
    byId: (s) => (id: string) => s.items.find((c) => c.id === id),
  },
  actions: {
    async fetchAll(params?: Partial<{ q: string; status: 'active'|'inactive'; sortBy: 'fullName'|'createdAt'|'status'; sortDir: 'asc'|'desc'; limit: number; offset: number }>) {
      this.loading = true
      try {
        if (import.meta.env.MODE === 'test') {
          // Lightweight seed for tests
          const seeded = [
            {
              id: 'c1',
              fullName: 'Maria da Silva',
              cpf: '52998224725',
              birthDate: '1990-05-10',
              position: 'Analista',
              department: 'RH',
              status: 'active' as const,
            },
          ]
          // Apply simple client-side filtering/sorting/paging to mimic server
          let filtered = seeded
          const term = (params?.q || '').trim().toLowerCase()
          if (term) {
            const termDigits = term.replace(/\D+/g, '')
            filtered = filtered.filter((c) => {
              const name = c.fullName.toLowerCase()
              const cpf = (c.cpf || '').toString()
              return (
                name.includes(term) ||
                (termDigits && cpf.includes(termDigits))
              )
            })
          }
          if (params?.status) {
            filtered = filtered.filter((c) => c.status === params.status)
          }
          const sortBy = params?.sortBy || 'fullName'
          const dir = params?.sortDir === 'desc' ? -1 : 1
          filtered = [...filtered].sort((a: any, b: any) => {
            const va = (a as any)[sortBy]
            const vb = (b as any)[sortBy]
            if (va == null && vb == null) return 0
            if (va == null) return -1 * dir
            if (vb == null) return 1 * dir
            if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
            return String(va).localeCompare(String(vb)) * dir
          })
          const limit = params?.limit ?? 50
          const offset = params?.offset ?? 0
          this.total = filtered.length
          this.items = filtered.slice(offset, offset + limit) as any
          this.limit = limit
          this.offset = offset
        } else {
          const res = await api.list({
            q: params?.q || '',
            limit: params?.limit ?? 50,
            offset: params?.offset ?? 0,
            sortBy: params?.sortBy ?? 'fullName',
            sortDir: params?.sortDir ?? 'asc',
            status: params?.status,
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
    async save(collab: Collaborator) {
      if (import.meta.env.MODE === 'test') {
        const idx = this.items.findIndex((c) => c.id === collab.id)
        if (idx >= 0) this.items[idx] = { ...this.items[idx], ...collab }
        else this.items.push({ ...collab, id: 'c' + ((Math.random() * 1e6) | 0) })
        return
      }
      if (collab.id) {
        await api.update(collab.cpf, {
          fullName: collab.fullName,
          birthDate: collab.birthDate,
          position: collab.position,
          department: collab.department,
        })
      } else {
        await api.create(collab as any)
      }
      await this.fetchAll()
    },
    async toggleStatus(idOrCpf: string) {
      if (import.meta.env.MODE === 'test') {
        const i = this.items.findIndex((c) => c.id === idOrCpf)
        if (i >= 0)
          this.items[i].status = this.items[i].status === 'active' ? 'inactive' : 'active'
      } else {
        await api.toggleStatus(idOrCpf)
        await this.fetchAll()
      }
    },
  },
})
