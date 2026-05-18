import type { Customer } from '@/shared/types/api'

export const customer1: Customer = {
  id: 'cust-1',
  name: 'Transportes Silva Ltda',
  cnpj: '11222333000181',
  email: 'silva@transportes.com',
  phone: '11999990001',
  tenantId: 'tenant-1',
  createdAt: '2025-01-01T00:00:00Z',
}

export const customer2: Customer = {
  id: 'cust-2',
  name: 'Logistica ABC S.A.',
  cnpj: '07526557000100',
  email: 'abc@logistica.com',
  phone: '11999990002',
  tenantId: 'tenant-1',
  createdAt: '2025-01-02T00:00:00Z',
}

export const customersList: Customer[] = [customer1, customer2]
