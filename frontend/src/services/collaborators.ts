import { httpGet, httpPatch, httpPost } from './http'
import type { Collaborator } from '../types/models'

export type ListParams = {
  q?: string
  limit?: number
  offset?: number
  sortBy?: 'fullName' | 'createdAt' | 'status'
  sortDir?: 'asc' | 'desc'
  status?: 'active' | 'inactive'
}

export async function list(params: ListParams = {}): Promise<{
  results: Collaborator[]
  total: number
  limit: number
  offset: number
}> {
  const q = new URLSearchParams()
  if (params.q) q.set('q', params.q)
  if (params.limit != null) q.set('limit', String(params.limit))
  if (params.offset != null) q.set('offset', String(params.offset))
  if (params.sortBy) q.set('sortBy', params.sortBy)
  if (params.sortDir) q.set('sortDir', params.sortDir)
  if (params.status) q.set('status', params.status)
  return httpGet(`/collaborators?${q.toString()}`)
}

export async function create(input: Omit<Collaborator, 'id' | 'status'> & {
  status?: Collaborator['status']
}): Promise<Collaborator> {
  return httpPost('/collaborators', input)
}

export async function update(
  cpf: string,
  updates: Partial<Pick<Collaborator, 'fullName' | 'birthDate' | 'position' | 'department'>>,
): Promise<Collaborator> {
  return httpPatch(`/collaborators/${encodeURIComponent(cpf)}`, updates)
}

export async function toggleStatus(
  idOrCpf: string,
  next?: 'active' | 'inactive',
): Promise<Collaborator> {
  const cpf = idOrCpf
  return httpPatch(`/collaborators/${encodeURIComponent(cpf)}/status`, {
    status: next || 'inactive',
  })
}
