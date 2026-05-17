import { api } from '@/shared/api/client'
import type { Tracker } from '@/shared/types/api'

export const trackersApi = {
  getAll: () => api.get<Tracker[]>('/trackers').then((r) => r.data),
  getOne: (id: string) => api.get<Tracker>(`/trackers/${id}`).then((r) => r.data),
  create: (data: Omit<Tracker, 'id' | 'tenantId' | 'createdAt' | 'vehicle' | 'chip'>) =>
    api.post<Tracker>('/trackers', data).then((r) => r.data),
  update: (id: string, data: Partial<Omit<Tracker, 'id' | 'tenantId' | 'createdAt'>>) =>
    api.patch<Tracker>(`/trackers/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/trackers/${id}`).then((r) => r.data),
}
