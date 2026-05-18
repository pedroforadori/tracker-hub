import { describe, expect, it } from 'vitest'
import { useBillingStore } from '../billingStore'

const futureDate = new Date(Date.now() + 3 * 86_400_000).toISOString()

describe('billingStore', () => {
  it('tem estado inicial correto', () => {
    const state = useBillingStore.getState()
    expect(state.isBlocked).toBe(false)
    expect(state.isPastDue).toBe(false)
    expect(state.blockMessage).toBeNull()
    expect(state.gracePeriodEndsAt).toBeNull()
  })

  it('setBlocked() define isBlocked e blockMessage, limpa isPastDue', () => {
    const { setBlocked } = useBillingStore.getState()
    useBillingStore.setState({ isPastDue: true })
    setBlocked('Pagamento recusado')

    const state = useBillingStore.getState()
    expect(state.isBlocked).toBe(true)
    expect(state.blockMessage).toBe('Pagamento recusado')
    expect(state.isPastDue).toBe(false)
  })

  it('setPastDue() define isPastDue e gracePeriodEndsAt, limpa isBlocked', () => {
    const { setPastDue } = useBillingStore.getState()
    useBillingStore.setState({ isBlocked: true })
    setPastDue(futureDate)

    const state = useBillingStore.getState()
    expect(state.isPastDue).toBe(true)
    expect(state.gracePeriodEndsAt).toBe(futureDate)
    expect(state.isBlocked).toBe(false)
  })

  it('clearBilling() reseta todos os campos para o estado inicial', () => {
    const { setBlocked, clearBilling } = useBillingStore.getState()
    setBlocked('Erro de pagamento')
    clearBilling()

    const state = useBillingStore.getState()
    expect(state.isBlocked).toBe(false)
    expect(state.isPastDue).toBe(false)
    expect(state.blockMessage).toBeNull()
    expect(state.gracePeriodEndsAt).toBeNull()
  })

  it('setBlocked e setPastDue são mutuamente exclusivos', () => {
    const { setBlocked, setPastDue } = useBillingStore.getState()
    setBlocked('bloqueado')
    setPastDue(futureDate)
    expect(useBillingStore.getState().isBlocked).toBe(false)
    expect(useBillingStore.getState().isPastDue).toBe(true)

    setBlocked('bloqueado de novo')
    expect(useBillingStore.getState().isPastDue).toBe(false)
    expect(useBillingStore.getState().isBlocked).toBe(true)
  })
})
