import { http, HttpResponse } from 'msw'
import { activeStatus } from '../../fixtures/billing.fixtures'

const BASE = 'http://localhost:3333'

export const billingHandlers = [
  http.get(`${BASE}/billing/status`, () => {
    return HttpResponse.json(activeStatus)
  }),

  http.post(`${BASE}/billing/setup-intent`, () => {
    return HttpResponse.json({ clientSecret: 'seti_test_secret_xyz_fake' })
  }),

  http.post(`${BASE}/billing/payment-method`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Endpoint auxiliar para testes de interceptors
  http.get(`${BASE}/test-probe`, (_, ...args) => {
    return HttpResponse.json({ ok: true })
  }),
]
