import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/msw/server'
import { authenticateAsAdmin } from '@/test/helpers/storeHelpers'
import { useAuthStore } from '@/shared/store/authStore'
import { useBillingStore } from '@/shared/store/billingStore'
import { api } from '../client'

const BASE = 'http://localhost:3333'

describe('client — request interceptor', () => {
  it('adiciona header Authorization quando token existe', async () => {
    authenticateAsAdmin()
    let capturedAuth = ''

    server.use(
      http.get(`${BASE}/test-probe`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization') ?? ''
        return HttpResponse.json({ ok: true })
      }),
    )

    await api.get('/test-probe')
    expect(capturedAuth).toBe('Bearer fake-jwt-admin')
  })

  it('não adiciona header Authorization quando token é null', async () => {
    let capturedAuth: string | null = 'present'

    server.use(
      http.get(`${BASE}/test-probe`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    await api.get('/test-probe')
    expect(capturedAuth).toBeNull()
  })
})

describe('client — response interceptor (sucesso)', () => {
  it('x-payment-warning + x-grace-period-ends → billingStore.setPastDue()', async () => {
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

    const billing = useBillingStore.getState()
    expect(billing.isPastDue).toBe(true)
    expect(billing.gracePeriodEndsAt).toBe(graceDate)
  })

  it('sem x-payment-warning → billingStore permanece limpo', async () => {
    server.use(
      http.get(`${BASE}/test-probe`, () => HttpResponse.json({ ok: true })),
    )

    await api.get('/test-probe')

    expect(useBillingStore.getState().isPastDue).toBe(false)
  })
})

describe('client — response interceptor (erros)', () => {
  it('401 → authStore.logout()', async () => {
    authenticateAsAdmin()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    server.use(
      http.get(`${BASE}/test-probe`, () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    )

    await api.get('/test-probe').catch(() => {})

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('402 → billingStore.setBlocked() com mensagem do response', async () => {
    server.use(
      http.get(`${BASE}/test-probe`, () =>
        HttpResponse.json(
          { message: 'Acesso bloqueado, contate o administrador.' },
          { status: 402 },
        ),
      ),
    )

    await api.get('/test-probe').catch(() => {})

    const billing = useBillingStore.getState()
    expect(billing.isBlocked).toBe(true)
    expect(billing.blockMessage).toBe('Acesso bloqueado, contate o administrador.')
  })

  it('500 → não interfere nos stores', async () => {
    server.use(
      http.get(`${BASE}/test-probe`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
      ),
    )

    await api.get('/test-probe').catch(() => {})

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useBillingStore.getState().isBlocked).toBe(false)
  })
})
