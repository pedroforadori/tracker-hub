import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/msw/server'
import { useAuthStore } from '@/shared/store/authStore'
import { useBillingStore } from '@/shared/store/billingStore'
import { LoginPage } from '../LoginPage'

const BASE = 'http://localhost:3333'

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<span>home</span>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/e-mail/i), email)
  await user.type(screen.getByLabelText('Senha'), password)
  await user.click(screen.getByRole('button', { name: /entrar/i }))
}

describe('LoginPage', () => {
  it('renderiza campos e botão', () => {
    renderLoginPage()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('e-mail inválido → erro client-side sem request HTTP', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    await user.type(screen.getByLabelText(/e-mail/i), 'invalido')
    await user.tab()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/e-mail inválido/i))
  })

  it('login bem-sucedido → authStore populado + navega para /', async () => {
    renderLoginPage()
    await fillAndSubmit('admin@test.com', 'Senha123')

    await waitFor(() => expect(screen.getByText('home')).toBeInTheDocument())
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user?.email).toBe('admin@test.com')
  })

  it('credenciais erradas (401) → mensagem de erro', async () => {
    renderLoginPage()
    // Senha válida para Zod mas rejeitada pela API (handler MSW retorna 401)
    await fillAndSubmit('admin@test.com', 'SenhaErrada1')

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/e-mail ou senha incorretos/i),
    )
  })

  it('conta bloqueada (402) → mensagem específica de billing', async () => {
    renderLoginPage()
    await fillAndSubmit('blocked@test.com', 'Senha123')

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/acesso bloqueado por inadimplência/i),
    )
  })

  it('login com PAST_DUE → billingStore.setPastDue() chamado', async () => {
    const graceDate = new Date(Date.now() + 3 * 86_400_000).toISOString()
    server.use(
      http.get(`${BASE}/billing/status`, () =>
        HttpResponse.json({ status: 'PAST_DUE', gracePeriodEndsAt: graceDate, blockReason: null, trialEndsAt: null, lastFour: null, cardBrand: null }),
      ),
    )

    renderLoginPage()
    await fillAndSubmit('admin@test.com', 'Senha123')

    await waitFor(() => expect(screen.getByText('home')).toBeInTheDocument())
    await waitFor(() => expect(useBillingStore.getState().isPastDue).toBe(true))
  })

  it('durante submit → botão "Entrando..." e desabilitado', async () => {
    let resolveLogin!: (v: unknown) => void
    server.use(
      http.post(`${BASE}/auth/login`, () => new Promise((res) => { resolveLogin = res })),
    )

    const user = userEvent.setup()
    renderLoginPage()
    await user.type(screen.getByLabelText(/e-mail/i), 'admin@test.com')
    await user.type(screen.getByLabelText('Senha'), 'Senha123')
    user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled())

    resolveLogin(new HttpResponse(JSON.stringify({ accessToken: 'x', user: {} })))
  })
})
