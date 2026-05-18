import { http, HttpResponse } from 'msw'
import { adminMember, teamList } from '../../fixtures/team.fixtures'

const BASE = 'http://localhost:3333'

export const teamHandlers = [
  http.get(`${BASE}/users`, () => HttpResponse.json(teamList)),
  http.get(`${BASE}/users/:id`, () => HttpResponse.json(adminMember)),
  http.post(`${BASE}/users`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...adminMember, ...(body as object) }, { status: 201 })
  }),
  http.patch(`${BASE}/users/:id`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...adminMember, ...(body as object) })
  }),
  http.delete(`${BASE}/users/:id`, () => new HttpResponse(null, { status: 204 })),
]
