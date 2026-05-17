import { api } from './client'

export function createCrudApi<T extends { id: string }>(endpoint: string) {
  return {
    getAll: () => api.get<T[]>(endpoint).then((r) => r.data),
    getOne: (id: string) => api.get<T>(`${endpoint}/${id}`).then((r) => r.data),
    create: (data: unknown) => api.post<T>(endpoint, data).then((r) => r.data),
    update: (id: string, data: unknown) => api.patch<T>(`${endpoint}/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`${endpoint}/${id}`).then((r) => r.data),
  }
}
