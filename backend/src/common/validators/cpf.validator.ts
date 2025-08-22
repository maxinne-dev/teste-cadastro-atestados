import { ValidateBy, buildMessage, ValidationOptions } from 'class-validator'
import { isValidCpf, normalizeCpf } from './br.js'

export const IS_CPF = 'isCpf'

export function IsCpf(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: IS_CPF,
      validator: {
        validate: (value: any) => isValidCpf(value),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}must be a valid CPF`,
          validationOptions
        ),
      },
    },
    validationOptions
  )
}

export function normalizeCpfTransform(value: any) {
  return normalizeCpf(value)
}

