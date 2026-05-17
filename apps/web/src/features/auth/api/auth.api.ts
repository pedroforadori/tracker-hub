import { api } from '@/shared/api/client'
import type { AuthResponse } from '@/shared/types/api'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (data: { name: string; email: string; password: string; tenantName: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
}
