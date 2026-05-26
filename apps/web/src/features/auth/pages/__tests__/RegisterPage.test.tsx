import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/msw/server'
import { useAuthStore } from '@/shared/store/authStore'
import { RegisterPage } from '../RegisterPage'

const BASE = 'http://localhost:3333'

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/cadastro']}>
      <Routes>
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/dashboard" element={<span>dashboard</span>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillForm(overrides?: {
  tenantName?: string
  name?: string
  email?: string
  password?: string
  confirm?: string
}) {
  const user = userEvent.setup()
  const o = {
    tenantName: 'Empresa Teste Ltda.',
    name: 'João Silva',
    email: 'admin@empresa.com',
    password: 'Senha123!',
    confirm: 'Senha123!',
    ...overrides,
  }
  await user.type(screen.getByLabelText(/nome da empresa/i), o.tenantName)
  await user.type(screen.getByLabelText(/nome completo/i), o.name)
  await user.type(screen.getByLabelText(/e-mail/i), o.email)

  const [pwdInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
  await user.type(pwdInput, o.password)
  await user.type(confirmInput, o.confirm)

  return user
}

describe('RegisterPage', () => {
  it('renderiza todos os campos do formulário', () => {
    renderRegisterPage()
    expect(screen.getByLabelText(/nome da empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument()
  })

  it('erro de validação quando senhas não coincidem', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await fillForm({ password: 'Senha123!', confirm: 'Diferente1!' })
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/senhas não coincidem/i),
    )
  })

  it('erro de validação quando nome da empresa é muito curto', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await fillForm({ tenantName: 'A' })
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/ao menos 2 caracteres/i),
    )
  })

  it('cadastro bem-sucedido → authStore populado + navega para /dashboard', async () => {
    renderRegisterPage()
    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument())
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('e-mail já cadastrado (409) → mensagem de erro específica', async () => {
    server.use(
      http.post(`${BASE}/auth/register`, () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 409 }),
      ),
    )

    renderRegisterPage()
    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/e-mail já cadastrado/i),
    )
  })

  it('erro genérico da API → mensagem de erro genérica', async () => {
    server.use(
      http.post(`${BASE}/auth/register`, () =>
        HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
      ),
    )

    renderRegisterPage()
    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/tente novamente/i),
    )
  })

  it('toggles de visibilidade funcionam nos campos de senha', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    const [pwdInput] = screen.getAllByPlaceholderText('••••••••') as HTMLInputElement[]
    expect(pwdInput.type).toBe('password')

    const showBtns = screen.getAllByRole('button', { name: /mostrar senha/i })
    await user.click(showBtns[0])
    expect(pwdInput.type).toBe('text')

    await user.click(screen.getAllByRole('button', { name: /ocultar senha/i })[0])
    expect(pwdInput.type).toBe('password')
  })

  it('durante submit → botão "Criando conta..." e desabilitado', async () => {
    let resolveRegister!: (v: unknown) => void
    server.use(
      http.post(`${BASE}/auth/register`, () => new Promise((res) => { resolveRegister = res })),
    )

    const user = userEvent.setup()
    renderRegisterPage()
    await fillForm()
    user.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /criando conta/i })).toBeDisabled(),
    )

    resolveRegister(new HttpResponse(JSON.stringify({ accessToken: 'x', user: {} }), { status: 201 }))
  })
})
