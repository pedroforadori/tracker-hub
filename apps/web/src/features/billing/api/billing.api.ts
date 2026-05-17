import { api } from '../../../shared/api/client'
import type { BillingStatus } from '../../../shared/types/api'

export const billingApi = {
  getStatus: () => api.get<BillingStatus>('/billing/status').then((r) => r.data),
  createSetupIntent: () =>
    api.post<{ clientSecret: string }>('/billing/setup-intent').then((r) => r.data),
  updatePaymentMethod: (paymentMethodId: string) =>
    api.post('/billing/payment-method', { paymentMethodId }),
}
