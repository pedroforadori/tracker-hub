import { http, HttpResponse } from 'msw'
import { customer1, customersList } from '../../fixtures/customers.fixtures'

const BASE = 'http://localhost:3333'

export const customersHandlers = [
  http.get(`${BASE}/customers`, () => HttpResponse.json(customersList)),
  http.get(`${BASE}/customers/:id`, () => HttpResponse.json(customer1)),
  http.post(`${BASE}/customers`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...customer1, ...(body as object) }, { status: 201 })
  }),
  http.patch(`${BASE}/customers/:id`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...customer1, ...(body as object) })
  }),
  http.delete(`${BASE}/customers/:id`, () => new HttpResponse(null, { status: 204 })),
]
