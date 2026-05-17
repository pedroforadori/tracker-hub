import { z } from 'zod'

const CURRENT_YEAR = new Date().getFullYear()

function isValidCNPJ(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  const d = cnpj.split('').map(Number)
  const calc = (nums: number[], weights: number[]) =>
    nums.reduce((sum, n, i) => sum + n * weights[i], 0)

  const r1 = calc(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11
  if (d[12] !== (r1 < 2 ? 0 : 11 - r1)) return false

  const r2 = calc(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11
  return d[13] === (r2 < 2 ? 0 : 11 - r2)
}

function isValidLuhn(digits: string): boolean {
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)
    if (alt) { n *= 2; if (n > 9) n -= 9 }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export const f = {
  name:     z.string().min(2, 'Mínimo 2 caracteres'),
  email:    z.string().email('E-mail inválido'),
  phone:    z.string().min(10, 'Telefone inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Deve conter ao menos uma letra e um número'),
  year:     z.number().int().min(1990, 'Ano mínimo: 1990').max(CURRENT_YEAR + 1, `Ano máximo: ${CURRENT_YEAR + 1}`),
  cnpj:     z.string().length(14, 'CNPJ deve ter 14 dígitos').refine(isValidCNPJ, 'CNPJ inválido'),
  imei:     z.string().length(15, 'IMEI deve ter 15 dígitos').refine(isValidLuhn, 'IMEI inválido'),
}
