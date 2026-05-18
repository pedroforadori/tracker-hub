import { http, HttpResponse } from 'msw'
import { chip1, chipsList } from '../../fixtures/chips.fixtures'

const BASE = 'http://localhost:3333'

export const chipsHandlers = [
  http.get(`${BASE}/chips`, () => HttpResponse.json(chipsList)),
  http.get(`${BASE}/chips/:id`, () => HttpResponse.json(chip1)),
  http.post(`${BASE}/chips`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...chip1, ...(body as object) }, { status: 201 })
  }),
  http.patch(`${BASE}/chips/:id`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...chip1, ...(body as object) })
  }),
  http.delete(`${BASE}/chips/:id`, () => new HttpResponse(null, { status: 204 })),
]
