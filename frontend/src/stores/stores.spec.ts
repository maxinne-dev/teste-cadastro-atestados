import { setActivePinia, createPinia } from 'pinia'
import { useCollaboratorsStore } from './collaborators'
import { useCertificatesStore } from './certificates'
import { useAuthStore } from './auth'
import { daysBetweenInclusive, clampDateRange } from '../utils/date-range'

describe('Pinia stores', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('auth login/logout toggles token and user', async () => {
    const auth = useAuthStore()
    await auth.loginDummy('user@example.com', 'x')
    expect(auth.isAuthed).toBe(true)
    await auth.logout()
    expect(auth.isAuthed).toBe(false)
  })

  it('collaborators fetch/update/toggle', async () => {
    const collabs = useCollaboratorsStore()
    await collabs.fetchAll()
    const initial = collabs.items.length
    expect(initial).toBeGreaterThan(0)
    const first = collabs.items[0]
    const prevStatus = first.status
    await collabs.toggleStatus(first.id)
    const now = collabs.items.find((c) => c.id === first.id)!
    expect(now.status).not.toBe(prevStatus)
  })

  it('certificates fetch/add/cancel', async () => {
    const certs = useCertificatesStore()
    await certs.fetchAll()
    const before = certs.count
    await certs.create({
      collaboratorId: 'c1',
      startDate: '2025-01-10',
      endDate: '2025-01-12',
      days: 3,
      diagnosis: 'Test',
    })
    expect(certs.count).toBe(before + 1)
    const created = certs.items[certs.items.length - 1]
    await certs.cancel(created.id)
    expect(certs.items.find((c) => c.id === created.id)?.status).toBe(
      'cancelled',
    )
  })
})

describe('date-range helpers', () => {
  it('calculates inclusive day spans and clamps', () => {
    expect(daysBetweenInclusive('2025-01-01', '2025-01-05')).toBe(5)
    const [s, e] = clampDateRange(
      new Date('2025-01-01'),
      new Date('2025-01-05'),
      new Date('2025-01-03'),
    )
    expect(s.toISOString().slice(0, 10)).toBe('2025-01-03')
    expect(e.toISOString().slice(0, 10)).toBe('2025-01-05')
  })
})
