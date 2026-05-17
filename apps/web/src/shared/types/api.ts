export type UserRole = 'ADMIN' | 'USER'

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: UserRole
  tenantId: string
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export interface Customer {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string
  tenantId: string
  createdAt: string
}

export interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  customerId: string
  tenantId: string
  customer?: { id: string; name: string }
  createdAt: string
}

export interface Tracker {
  id: string
  imei: string
  model: string
  brand: string
  vehicleId: string
  tenantId: string
  vehicle?: { id: string; plate: string }
  chip?: Chip
  createdAt: string
}

export interface Chip {
  id: string
  iccid: string
  phoneNumber: string
  provider: string
  trackerId: string
  tenantId: string
  tracker?: { id: string; imei: string }
  createdAt: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId: string
  createdAt: string
}
