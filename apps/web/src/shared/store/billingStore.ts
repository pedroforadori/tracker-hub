import { create } from 'zustand'

interface BillingState {
  isBlocked: boolean
  isPastDue: boolean
  blockMessage: string | null
  gracePeriodEndsAt: string | null
  setBlocked: (message: string) => void
  setPastDue: (gracePeriodEndsAt: string) => void
  clearBilling: () => void
}

export const useBillingStore = create<BillingState>()((set) => ({
  isBlocked: false,
  isPastDue: false,
  blockMessage: null,
  gracePeriodEndsAt: null,
  setBlocked: (message) =>
    set({ isBlocked: true, isPastDue: false, blockMessage: message }),
  setPastDue: (gracePeriodEndsAt) =>
    set({ isPastDue: true, isBlocked: false, gracePeriodEndsAt }),
  clearBilling: () =>
    set({ isBlocked: false, isPastDue: false, blockMessage: null, gracePeriodEndsAt: null }),
}))
