export type Collaborator = {
  id?: string
  fullName: string
  cpf: string
  birthDate: string
  position: string
  department?: string
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

