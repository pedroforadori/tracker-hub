import { api } from '@/shared/api/client'
import type { Customer } from '@/shared/types/api'

export const customersApi = {
  getAll: () => api.get<Customer[]>('/customers').then((r) => r.data),
  getOne: (id: string) => api.get<Customer>(`/customers/${id}`).then((r) => r.data),
  create: (data: Omit<Customer, 'id' | 'tenantId' | 'createdAt'>) =>
    api.post<Customer>('/customers', data).then((r) => r.data),
  update: (id: string, data: Partial<Omit<Customer, 'id' | 'tenantId' | 'createdAt'>>) =>
    api.patch<Customer>(`/customers/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/customers/${id}`).then((r) => r.data),
}
