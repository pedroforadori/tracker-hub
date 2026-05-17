import { z } from 'zod'

const CURRENT_YEAR = new Date().getFullYear()

export const f = {
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  year: z.number().int().min(1990, 'Ano mínimo: 1990').max(CURRENT_YEAR + 1, `Ano máximo: ${CURRENT_YEAR + 1}`),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos'),
  imei: z.string().length(15, 'IMEI deve ter 15 dígitos'),
}
