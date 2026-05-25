import { api } from '@/shared/api/client'
import type { AuthUser } from '@/shared/types/api'

export interface UpdateProfilePayload {
  name?: string
  password?: string
}

export const profileApi = {
  getMe: () => api.get<AuthUser>('/auth/me').then((r) => r.data),
  updateMe: (payload: UpdateProfilePayload) =>
    api.patch<AuthUser>('/auth/me', payload).then((r) => r.data),
}
