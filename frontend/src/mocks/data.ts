export type Collaborator = {
  id: string
  fullName: string
  cpf: string
  birthDate: string
  position: string
  department: string
  status: 'active' | 'inactive'
}

export type Certificate = {
  id: string
  collaboratorId: string
  startDate: string
  endDate: string
  days: number
  diagnosis?: string
  icdCode?: string
  icdTitle?: string
  status: 'active' | 'cancelled' | 'expired'
}

export type ICD = { code: string; title: string }

// Dummy data (in-memory only)
export const collaborators: Collaborator[] = [
  {
    id: 'c1',
    fullName: 'Maria da Silva',
    cpf: '52998224725',
    birthDate: '1990-05-10',
    position: 'Analista',
    department: 'RH',
    status: 'active',
  },
  {
    id: 'c2',
    fullName: 'João Pereira',
    cpf: '12345678909',
    birthDate: '1985-08-20',
    position: 'Dev',
    department: 'TI',
    status: 'inactive',
  },
]

export const certificates: Certificate[] = [
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

export const icdList: ICD[] = [
  { code: 'J06.9', title: 'Acute upper respiratory infection, unspecified' },
  { code: 'R50.9', title: 'Fever, unspecified' },
  { code: 'M54.5', title: 'Low back pain' },
]

export function listCollaborators() {
  return [...collaborators]
}

export function addOrUpdateCollaborator(
  input: Partial<Collaborator> & { id?: string },
) {
  if (input.id) {
    const idx = collaborators.findIndex((c) => c.id === input.id)
    if (idx >= 0)
      collaborators[idx] = { ...collaborators[idx], ...input } as Collaborator
    return collaborators[idx]
  }
  const id = 'c' + ((Math.random() * 1e6) | 0)
  const created: Collaborator = {
    id,
    fullName: input.fullName || '',
    cpf: input.cpf || '',
    birthDate: input.birthDate || '',
    position: input.position || '',
    department: input.department || '',
    status: (input.status as any) || 'active',
  }
  collaborators.push(created)
  return created
}

export function toggleCollaboratorStatus(id: string) {
  const c = collaborators.find((c) => c.id === id)
  if (c) c.status = c.status === 'active' ? 'inactive' : 'active'
  return c
}

export function listCertificates() {
  return [...certificates]
}

export function addCertificate(
  input: Omit<Certificate, 'id' | 'status'> & {
    status?: Certificate['status']
  },
) {
  const id = 'm' + ((Math.random() * 1e6) | 0)
  const created: Certificate = {
    id,
    status: input.status || 'active',
    ...input,
  }
  certificates.push(created)
  return created
}

export function cancelCertificate(id: string) {
  const m = certificates.find((c) => c.id === id)
  if (m && m.status === 'active') m.status = 'cancelled'
  return m
}
