import { httpGet, httpPatch, httpPost, isApiEnabled } from './http'
import type { Certificate } from '../types/models'

export type ListParams = {
  collaboratorId?: string
  icdCode?: string
  status?: Certificate['status']
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  sortBy?: 'issueDate' | 'startDate' | 'endDate' | 'icdCode'
  sortDir?: 'asc' | 'desc'
}

export async function list(params: ListParams = {}): Promise<{
  results: Certificate[]
  total: number
  limit: number
  offset: number
}> {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null) q.set(k, String(v))
  }
  return httpGet(`/medical-certificates?${q.toString()}`)
}

export async function create(input: Omit<Certificate, 'id' | 'status'> & { status?: Certificate['status'] }): Promise<Certificate> {
  return httpPost('/medical-certificates', input)
}

export async function cancel(id: string): Promise<Certificate> {
  return httpPatch(`/medical-certificates/${encodeURIComponent(id)}/cancel`)
}
