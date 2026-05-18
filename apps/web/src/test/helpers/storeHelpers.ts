import { useAuthStore } from '@/shared/store/authStore'
import { useBillingStore } from '@/shared/store/billingStore'
import type { AuthUser } from '@/shared/types/api'

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

export function resetAllStores() {
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false })
  useBillingStore.setState({
    isBlocked: false,
    isPastDue: false,
    blockMessage: null,
    gracePeriodEndsAt: null,
  })
}

export function authenticateAsAdmin() {
  useAuthStore.setState({ token: 'fake-jwt-admin', user: adminUser, isAuthenticated: true })
}

export function authenticateAsUser() {
  useAuthStore.setState({ token: 'fake-jwt-user', user: regularUser, isAuthenticated: true })
}

export function blockBilling(message = 'Pagamento não realizado') {
  useBillingStore.setState({ isBlocked: true, isPastDue: false, blockMessage: message })
}

export function setPastDue(date?: string) {
  const gracePeriodEndsAt = date ?? new Date(Date.now() + 3 * 86_400_000).toISOString()
  useBillingStore.setState({ isPastDue: true, isBlocked: false, gracePeriodEndsAt })
}
