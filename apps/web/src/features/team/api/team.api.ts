import { api } from '@/shared/api/client'
import type { TeamMember } from '@/shared/types/api'

export const teamApi = {
  getAll: () => api.get<TeamMember[]>('/users').then((r) => r.data),
  create: (data: { name: string; email: string; password: string }) =>
    api.post<TeamMember>('/users', data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; email: string; password: string }>) =>
    api.patch<TeamMember>(`/users/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
}
