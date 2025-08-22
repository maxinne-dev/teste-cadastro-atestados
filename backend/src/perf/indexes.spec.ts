import { CollaboratorSchema } from '../collaborators/collaborator.schema';
import { IcdCodeSchema } from '../icd-cache/icd-code.schema';
import { MedicalCertificateSchema } from '../medical-certificates/medical-certificate.schema';
import { UserSchema } from '../users/user.schema';

describe('Index verification', () => {
  it('Collaborators: unique cpf and fullName text index', () => {
    const idx = (CollaboratorSchema as any).indexes();
    const hasCpfUnique = idx.some(
      ([fields, opts]: [any, any]) => fields.cpf === 1 && opts?.unique === true,
    );
    const hasFullNameText = idx.some(
      ([fields]: [any, any]) => fields.fullName === 'text',
    );
    expect(hasCpfUnique).toBe(true);
    expect(hasFullNameText).toBe(true);
  });

  it('MedicalCertificates: compound collaboratorId+status, issueDate, and range startDate+endDate', () => {
    const idx = (MedicalCertificateSchema as any).indexes();
    const hasCompound = idx.some(
      ([fields]: [any, any]) =>
        fields.collaboratorId === 1 && fields.status === 1,
    );
    const hasIssue = idx.some(
      ([fields]: [any, any]) => fields.issueDate === -1,
    );
    const hasRange = idx.some(
      ([fields]: [any, any]) => fields.startDate === 1 && fields.endDate === 1,
    );
    expect(hasCompound).toBe(true);
    expect(hasIssue).toBe(true);
    expect(hasRange).toBe(true);
  });

  it('Users: unique email and roles index', () => {
    const idx = (UserSchema as any).indexes();
    const hasEmailUnique = idx.some(
      ([fields, opts]: [any, any]) =>
        fields.email === 1 && opts?.unique === true,
    );
    const hasRolesIndex = idx.some(
      ([fields]: [any, any]) => fields.roles === 1,
    );
    expect(hasEmailUnique).toBe(true);
    expect(hasRolesIndex).toBe(true);
  });

  it('ICD: unique code', () => {
    const idx = (IcdCodeSchema as any).indexes();
    const hasUnique = idx.some(
      ([fields, opts]: [any, any]) =>
        fields.code === 1 && opts?.unique === true,
    );
    expect(hasUnique).toBe(true);
  });
});
