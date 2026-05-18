import { describe, expect, it } from 'vitest'
import { f } from '../fields'

describe('f.name', () => {
  it('aceita string com 2 ou mais caracteres', () => {
    expect(f.name.safeParse('Jo').success).toBe(true)
    expect(f.name.safeParse('Maria Silva').success).toBe(true)
  })
  it('rejeita string com menos de 2 caracteres', () => {
    const r = f.name.safeParse('J')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Mínimo 2 caracteres')
  })
  it('rejeita string vazia', () => {
    expect(f.name.safeParse('').success).toBe(false)
  })
})

describe('f.email', () => {
  it('aceita e-mails válidos', () => {
    expect(f.email.safeParse('admin@test.com').success).toBe(true)
    expect(f.email.safeParse('user+tag@domain.org').success).toBe(true)
  })
  it('rejeita e-mails sem @', () => {
    expect(f.email.safeParse('nao-tem-arroba').success).toBe(false)
  })
  it('rejeita e-mails sem domínio', () => {
    expect(f.email.safeParse('@domain.com').success).toBe(false)
  })
  it('rejeita string vazia', () => {
    expect(f.email.safeParse('').success).toBe(false)
  })
})

describe('f.phone', () => {
  it('aceita telefone com 10 ou mais dígitos', () => {
    expect(f.phone.safeParse('1132109876').success).toBe(true)
    expect(f.phone.safeParse('11987654321').success).toBe(true)
  })
  it('rejeita telefone com menos de 10 caracteres', () => {
    const r = f.phone.safeParse('119876')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Telefone inválido')
  })
})

describe('f.password', () => {
  it('aceita senha com 8+ chars, letra e número', () => {
    expect(f.password.safeParse('Senha123').success).toBe(true)
    expect(f.password.safeParse('abcdef1g').success).toBe(true)
  })
  it('rejeita senha com menos de 8 caracteres', () => {
    const r = f.password.safeParse('Abc1')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Mínimo 8 caracteres')
  })
  it('rejeita senha sem número', () => {
    const r = f.password.safeParse('SemNumero')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toMatch(/letra e um número/)
  })
  it('rejeita senha só com números', () => {
    expect(f.password.safeParse('12345678').success).toBe(false)
  })
})

describe('f.year', () => {
  const currentYear = new Date().getFullYear()

  it('aceita ano entre 1990 e ano atual + 1', () => {
    expect(f.year.safeParse(1990).success).toBe(true)
    expect(f.year.safeParse(currentYear).success).toBe(true)
    expect(f.year.safeParse(currentYear + 1).success).toBe(true)
  })
  it('rejeita ano anterior a 1990', () => {
    const r = f.year.safeParse(1989)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Ano mínimo: 1990')
  })
  it('rejeita ano acima do máximo', () => {
    expect(f.year.safeParse(currentYear + 2).success).toBe(false)
  })
  it('rejeita valores não inteiros', () => {
    expect(f.year.safeParse(2020.5).success).toBe(false)
  })
})

describe('f.cnpj', () => {
  it('aceita CNPJ com checksum válido', () => {
    expect(f.cnpj.safeParse('11222333000181').success).toBe(true)
    expect(f.cnpj.safeParse('07526557000100').success).toBe(true)
  })
  it('rejeita CNPJ com dígito verificador errado', () => {
    const r = f.cnpj.safeParse('11222333000182')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('CNPJ inválido')
  })
  it('rejeita CNPJ com sequência repetida (ex: 11111111111111)', () => {
    expect(f.cnpj.safeParse('11111111111111').success).toBe(false)
    expect(f.cnpj.safeParse('00000000000000').success).toBe(false)
  })
  it('rejeita CNPJ com comprimento diferente de 14', () => {
    const r = f.cnpj.safeParse('1122233300018')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('CNPJ deve ter 14 dígitos')
  })
})

describe('f.imei', () => {
  it('aceita IMEI com algoritmo Luhn válido', () => {
    expect(f.imei.safeParse('356938035643809').success).toBe(true)
    expect(f.imei.safeParse('490154203237518').success).toBe(true)
  })
  it('rejeita IMEI com Luhn inválido', () => {
    const r = f.imei.safeParse('356938035643800')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('IMEI inválido')
  })
  it('rejeita IMEI com 14 dígitos', () => {
    const r = f.imei.safeParse('35693803564380')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('IMEI deve ter 15 dígitos')
  })
  it('rejeita IMEI com 16 dígitos', () => {
    expect(f.imei.safeParse('3569380356438091').success).toBe(false)
  })
})
