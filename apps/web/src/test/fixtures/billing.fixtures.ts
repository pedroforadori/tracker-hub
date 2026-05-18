import type { BillingStatus } from '@/shared/types/api'

export const activeStatus: BillingStatus = {
  status: 'ACTIVE',
  blockReason: null,
  gracePeriodEndsAt: null,
  trialEndsAt: null,
  lastFour: '4242',
  cardBrand: 'visa',
}

export const trialingStatus: BillingStatus = {
  status: 'TRIALING',
  blockReason: null,
  gracePeriodEndsAt: null,
  trialEndsAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  lastFour: null,
  cardBrand: null,
}

export const pastDueStatus: BillingStatus = {
  status: 'PAST_DUE',
  blockReason: 'Cobrança recusada pelo banco emissor do cartão',
  gracePeriodEndsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
  trialEndsAt: null,
  lastFour: '4242',
  cardBrand: 'visa',
}

export const blockedStatus: BillingStatus = {
  status: 'BLOCKED',
  blockReason: 'Pagamento não realizado após o período de carência',
  gracePeriodEndsAt: null,
  trialEndsAt: null,
  lastFour: null,
  cardBrand: null,
}

export const canceledStatus: BillingStatus = {
  status: 'CANCELED',
  blockReason: null,
  gracePeriodEndsAt: null,
  trialEndsAt: null,
  lastFour: null,
  cardBrand: null,
}
