import { api } from '@/shared/api/client'
import type { Vehicle } from '@/shared/types/api'

export const vehiclesApi = {
  getAll: () => api.get<Vehicle[]>('/vehicles').then((r) => r.data),
  getOne: (id: string) => api.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),
  create: (data: Omit<Vehicle, 'id' | 'tenantId' | 'createdAt' | 'customer'>) =>
    api.post<Vehicle>('/vehicles', data).then((r) => r.data),
  update: (id: string, data: Partial<Omit<Vehicle, 'id' | 'tenantId' | 'createdAt'>>) =>
    api.patch<Vehicle>(`/vehicles/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/vehicles/${id}`).then((r) => r.data),
}
