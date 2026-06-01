import { http, HttpResponse } from 'msw'
import { chip1, chipsList } from '../../fixtures/chips.fixtures'

const BASE = 'http://localhost:3333'

export const chipsHandlers = [
  // Specific routes must come before /:id to avoid matching conflicts
  http.get(`${BASE}/chips/export`, () =>
    new HttpResponse(new Blob(['mock-export'], { type: 'application/octet-stream' })),
  ),
  http.get(`${BASE}/chips/import/template`, () =>
    new HttpResponse(new Blob(['mock-template'], { type: 'application/octet-stream' })),
  ),
  http.post(`${BASE}/chips/import`, () =>
    HttpResponse.json({ imported: 2, errors: [] }, { status: 201 }),
  ),

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
