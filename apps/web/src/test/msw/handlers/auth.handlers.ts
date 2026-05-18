import { http, HttpResponse } from 'msw'
import { adminLoginResponse } from '../../fixtures/auth.fixtures'

const BASE = 'http://localhost:3333'

export const authHandlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }

    if (body.email === 'blocked@test.com') {
      return HttpResponse.json(
        { message: 'Acesso bloqueado, contate o administrador da conta.' },
        { status: 402 },
      )
    }

    if (body.password !== 'Senha123') {
      return HttpResponse.json({ message: 'Credenciais inválidas' }, { status: 401 })
    }

    return HttpResponse.json(adminLoginResponse)
  }),

  http.post(`${BASE}/auth/register`, async () => {
    return HttpResponse.json(adminLoginResponse, { status: 201 })
  }),
]
