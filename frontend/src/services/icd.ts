import { httpGet } from './http'
import type { ICD } from '../types/models'

export async function search(term: string): Promise<ICD[]> {
  const q = term.trim()
  if (!q) return []
  const res = await httpGet<{ results: ICD[] }>(`/icd/search?q=${encodeURIComponent(q)}`)
  return res.results || []
}
