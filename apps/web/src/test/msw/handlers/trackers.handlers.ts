import { http, HttpResponse } from 'msw'
import { tracker1, trackersList } from '../../fixtures/trackers.fixtures'

const BASE = 'http://localhost:3333'

export const trackersHandlers = [
  http.get(`${BASE}/trackers`, () => HttpResponse.json(trackersList)),
  http.get(`${BASE}/trackers/:id`, () => HttpResponse.json(tracker1)),
  http.post(`${BASE}/trackers`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...tracker1, ...(body as object) }, { status: 201 })
  }),
  http.patch(`${BASE}/trackers/:id`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...tracker1, ...(body as object) })
  }),
  http.delete(`${BASE}/trackers/:id`, () => new HttpResponse(null, { status: 204 })),
]
