import { http, HttpResponse } from 'msw'
import { vehicle1, vehiclesList } from '../../fixtures/vehicles.fixtures'

const BASE = 'http://localhost:3333'

export const vehiclesHandlers = [
  http.get(`${BASE}/vehicles`, () => HttpResponse.json(vehiclesList)),
  http.get(`${BASE}/vehicles/:id`, () => HttpResponse.json(vehicle1)),
  http.post(`${BASE}/vehicles`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...vehicle1, ...(body as object) }, { status: 201 })
  }),
  http.patch(`${BASE}/vehicles/:id`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...vehicle1, ...(body as object) })
  }),
  http.delete(`${BASE}/vehicles/:id`, () => new HttpResponse(null, { status: 204 })),
]
