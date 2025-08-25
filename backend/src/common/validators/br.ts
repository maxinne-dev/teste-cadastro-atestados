// Simple CPF utilities: normalization and validation

export function normalizeCpf(
  value: string | number | null | undefined,
): string {
  if (value == null) return '';
  return String(value).replace(/\D/g, '');
}

export function isValidCpf(value: string | number | null | undefined): boolean {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11) return false;
  if (/^([0-9])\1{10}$/.test(cpf)) return false; // all digits equal

  const calcCheckDigit = (base: string, factorStart: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base.charAt(i), 10) * (factorStart - i);
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calcCheckDigit(cpf.substring(0, 9), 10);
  const d2 = calcCheckDigit(cpf.substring(0, 10), 11);

  return cpf.endsWith(`${d1}${d2}`);
}
