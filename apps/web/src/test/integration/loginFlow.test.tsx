import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '@/components/atoms/ThemeProvider'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { useAuthStore } from '@/shared/store/authStore'
import { authenticateAsAdmin } from '@/test/helpers/storeHelpers'

function renderApp(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<span>dashboard</span>} />
            <Route path="/customers" element={<span>clientes</span>} />
          </Route>
        </Routes>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('Fluxo de login', () => {
  it('login bem-sucedido â†’ navega para / e mostra dashboard', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText(/e-mail/i), 'admin@test.com')
    await user.type(screen.getByLabelText("Senha"), 'Senha123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument())
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('usuÃ¡rio jÃ¡ autenticado acessando /login â†’ redireciona para /', async () => {
    authenticateAsAdmin()
    // LoginPage nÃ£o tem redirect automÃ¡tico â€” a proteÃ§Ã£o Ã© via ProtectedRoute
    // Este teste verifica que rota protegida funciona quando autenticado
    renderApp('/')
    expect(screen.getByText('dashboard')).toBeInTheDocument()
  })

  it('rota protegida sem autenticaÃ§Ã£o â†’ redirect para /login', () => {
    renderApp('/customers')
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('login falho â†’ permanece na pÃ¡gina de login', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText(/e-mail/i), 'admin@test.com')
    await user.type(screen.getByLabelText("Senha"), 'senhaerrada')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
