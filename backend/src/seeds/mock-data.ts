// Mock data registry to be filled incrementally as models land.
// Keep arrays small and representative; the seed script is idempotent on keys.

export const mockCollaborators: any[] = [
  {
    fullName: 'Maria da Silva',
    cpf: '52998224725', // valid CPF digits only
    birthDate: new Date('1990-05-10'),
    position: 'Analista de RH',
    department: 'Recursos Humanos',
    status: 'active',
  },
  {
    fullName: 'João Pereira',
    cpf: '11144477735',
    birthDate: new Date('1988-03-22'),
    position: 'Desenvolvedor',
    department: 'TI',
    status: 'active',
  },
];

export const mockUsers: any[] = [
  {
    email: 'admin@example.com',
    passwordHash: 'dev-hash',
    fullName: 'Admin',
    roles: ['admin'],
  },
  {
    email: 'hr@example.com',
    passwordHash: 'dev-hash',
    fullName: 'HR User',
    roles: ['hr'],
  },
];

export const mockIcdCodes: any[] = [
  {
    code: 'J06.9',
    title: 'Acute upper respiratory infection, unspecified',
    release: '2024-01',
  },
];

export const mockCertificates: any[] = [
  // Collaborator is linked via CPF; seed will resolve to collaboratorId
  {
    collaboratorCpf: '52998224725',
    icdCode: 'J06.9',
    icdTitle: 'Acute upper respiratory infection, unspecified',
    diagnosis: 'Resfriado comum',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-17'),
    days: 3,
    status: 'active',
    metadata: { seedKey: 'seed:demo:cert1' },
  },
];
