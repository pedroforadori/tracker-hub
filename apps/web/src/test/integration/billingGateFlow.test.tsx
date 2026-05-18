import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/msw/server'
import { authenticateAsAdmin, blockBilling } from '@/test/helpers/storeHelpers'
import { ThemeProvider } from '@/components/atoms/ThemeProvider'
import { BillingGate } from '@/features/billing/components/BillingGate'
import { api } from '@/shared/api/client'
import { useBillingStore } from '@/shared/store/billingStore'

const BASE = 'http://localhost:3333'

describe('Fluxo de bloqueio de billing', () => {
  it('interceptor 402 → billingStore.isBlocked = true', async () => {
    server.use(
      http.get(`${BASE}/test-probe`, () =>
        HttpResponse.json({ message: 'Acesso bloqueado.' }, { status: 402 }),
      ),
    )

    await api.get('/test-probe').catch(() => {})
    expect(useBillingStore.getState().isBlocked).toBe(true)
  })

  it('BillingGate com isBlocked → conteúdo não interativo + mensagem de bloqueio', () => {
    authenticateAsAdmin()
    blockBilling('Pagamento vencido')

    render(
      <MemoryRouter>
        <ThemeProvider>
          <BillingGate>
            <button>ação importante</button>
          </BillingGate>
        </ThemeProvider>
      </MemoryRouter>,
    )

    // O botão está visível mas dentro de aria-hidden (não interativo)
    const hiddenWrapper = screen.getByText('ação importante').closest('[aria-hidden]')
    expect(hiddenWrapper).toBeInTheDocument()
    expect(hiddenWrapper).toHaveClass('pointer-events-none')
  })

  it('BillingGate sem bloqueio → children normalmente interativos', () => {
    authenticateAsAdmin()

    render(
      <MemoryRouter>
        <ThemeProvider>
          <BillingGate>
            <button>ação importante</button>
          </BillingGate>
        </ThemeProvider>
      </MemoryRouter>,
    )

    const btn = screen.getByRole('button', { name: 'ação importante' })
    expect(btn).toBeInTheDocument()
    expect(btn.closest('[aria-hidden]')).toBeNull()
  })
})

describe('Fluxo de payment warning (grace period)', () => {
  it('header x-payment-warning → billingStore.isPastDue = true', async () => {
    const graceDate = new Date(Date.now() + 3 * 86_400_000).toISOString()
    server.use(
      http.get(`${BASE}/test-probe`, () =>
        new HttpResponse(JSON.stringify({ ok: true }), {
          headers: {
            'Content-Type': 'application/json',
            'x-payment-warning': 'true',
            'x-grace-period-ends': graceDate,
          },
        }),
      ),
    )

    await api.get('/test-probe')

    await waitFor(() => expect(useBillingStore.getState().isPastDue).toBe(true))
    expect(useBillingStore.getState().gracePeriodEndsAt).toBe(graceDate)
  })
})
