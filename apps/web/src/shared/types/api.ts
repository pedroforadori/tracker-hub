export type UserRole = 'ADMIN' | 'USER'

export type PlanStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'BLOCKED' | 'CANCELED'

export interface BillingStatus {
  status: PlanStatus
  blockReason: string | null
  gracePeriodEndsAt: string | null
  trialEndsAt: string | null
  lastFour: string | null
  cardBrand: string | null
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  tenantId: string
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export type CustomerStatus = 'ATIVO' | 'INATIVO'

export interface Customer {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string
  monthlyFee: number
  status: CustomerStatus
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

export interface ImportError {
  row: number
  message: string
}

export interface ImportResult {
  imported: number
  errors: ImportError[]
}

export interface ImportExportApi {
  importFile: (file: File) => Promise<ImportResult>
  downloadTemplate: (format: 'xlsx' | 'csv') => Promise<Blob>
  exportData: (from: string, to: string, format: 'xlsx' | 'csv') => Promise<Blob>
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId: string
  createdAt: string
}
