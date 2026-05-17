import { api } from '@/shared/api/client'
import type { Chip } from '@/shared/types/api'

export const chipsApi = {
  getAll: () => api.get<Chip[]>('/chips').then((r) => r.data),
  getOne: (id: string) => api.get<Chip>(`/chips/${id}`).then((r) => r.data),
  create: (data: Omit<Chip, 'id' | 'tenantId' | 'createdAt' | 'tracker'>) =>
    api.post<Chip>('/chips', data).then((r) => r.data),
  update: (id: string, data: Partial<Omit<Chip, 'id' | 'tenantId' | 'createdAt'>>) =>
    api.patch<Chip>(`/chips/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/chips/${id}`).then((r) => r.data),
}
