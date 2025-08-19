// Mock data registry to be filled incrementally as models land.
// Keep arrays small and representative; the seed script is idempotent on keys.

export const mockCollaborators: any[] = [
  // Example (uncomment and adjust as needed):
  // {
  //   fullName: 'Maria da Silva',
  //   cpf: '12345678909', // digits only
  //   birthDate: new Date('1990-05-10'),
  //   position: 'Analista de RH',
  //   department: 'Recursos Humanos',
  //   status: 'active',
  // },
];

export const mockUsers: any[] = [
  // Example:
  // { email: 'admin@example.com', passwordHash: 'hash', fullName: 'Admin', roles: ['admin'] },
];

export const mockIcdCodes: any[] = [
  // Example:
  // { code: 'J06.9', title: 'Acute upper respiratory infection, unspecified', release: '2024-01' },
];

export const mockCertificates: any[] = [
  // Example: denormalized certificate; collaboratorId can be set after collaborator insertion if desired
  // {
  //   icdCode: 'J06.9',
  //   icdTitle: 'Acute upper respiratory infection, unspecified',
  //   diagnosis: 'Resfriado comum',
  //   startDate: new Date('2025-01-15'),
  //   endDate: new Date('2025-01-17'),
  //   days: 3,
  //   status: 'active',
  // },
];

