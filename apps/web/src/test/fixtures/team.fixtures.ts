import type { TeamMember } from '@/shared/types/api'

export const adminMember: TeamMember = {
  id: 'user-admin-1',
  name: 'Admin Teste',
  email: 'admin@test.com',
  role: 'ADMIN',
  tenantId: 'tenant-1',
  createdAt: '2025-01-01T00:00:00Z',
}

export const regularMember: TeamMember = {
  id: 'user-regular-1',
  name: 'Usuario Teste',
  email: 'user@test.com',
  role: 'USER',
  tenantId: 'tenant-1',
  createdAt: '2025-01-02T00:00:00Z',
}

export const regularMember2: TeamMember = {
  id: 'user-regular-2',
  name: 'Usuario Dois',
  email: 'user2@test.com',
  role: 'USER',
  tenantId: 'tenant-1',
  createdAt: '2025-01-03T00:00:00Z',
}

export const teamList: TeamMember[] = [adminMember, regularMember]
