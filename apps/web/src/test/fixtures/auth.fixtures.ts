import type { AuthResponse, AuthUser } from '@/shared/types/api'

export const adminUser: AuthUser = {
  id: 'user-admin-1',
  email: 'admin@test.com',
  name: 'Admin Teste',
  role: 'ADMIN',
  tenantId: 'tenant-1',
}

export const regularUser: AuthUser = {
  id: 'user-regular-1',
  email: 'user@test.com',
  name: 'Usuario Teste',
  role: 'USER',
  tenantId: 'tenant-1',
}

export const adminLoginResponse: AuthResponse = {
  accessToken: 'fake-jwt-token-admin',
  user: adminUser,
}

export const userLoginResponse: AuthResponse = {
  accessToken: 'fake-jwt-token-user',
  user: regularUser,
}
