import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { authenticateAsAdmin, authenticateAsUser } from '@/test/helpers/storeHelpers'
import { useAuthStore } from '@/shared/store/authStore'
import { ThemeProvider } from '@/components/atoms/ThemeProvider'
import { MainLayout } from '../MainLayout'

vi.mock('@/features/billing/components/PaymentWarningBanner', () => ({
  PaymentWarningBanner: () => <div data-testid="payment-warning-banner" />,
}))

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/customers']}>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<span>login</span>} />
          <Route element={<MainLayout />}>
            <Route path="/customers" element={<span>outlet</span>} />
          </Route>
        </Routes>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('MainLayout', () => {
  it('exibe links de navegação básicos para todos os usuários', () => {
    authenticateAsAdmin()
    renderLayout()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /clientes/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /veículos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /rastreadores/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sim cards/i })).toBeInTheDocument()
  })

  it('ADMIN → exibe links "Equipe" e "Cobrança"', () => {
    authenticateAsAdmin()
    renderLayout()
    expect(screen.getByRole('link', { name: /equipe/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cobrança/i })).toBeInTheDocument()
  })

  it('USER → não exibe links "Equipe" e "Cobrança"', () => {
    authenticateAsUser()
    renderLayout()
    expect(screen.queryByRole('link', { name: /equipe/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /cobrança/i })).not.toBeInTheDocument()
  })

  it('exibe o nome e role do usuário logado', () => {
    authenticateAsAdmin()
    renderLayout()
    expect(screen.getByText('Admin Teste')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('exibe link de perfil que navega para /profile', () => {
    authenticateAsAdmin()
    renderLayout()
    expect(screen.getByRole('link', { name: /admin teste/i })).toHaveAttribute('href', '/profile')
  })

  it('clique em Sair → chama logout() e navega para /login', async () => {
    const user = userEvent.setup()
    authenticateAsAdmin()
    renderLayout()

    await user.click(screen.getByRole('button', { name: /sair/i }))

    expect(screen.getByText('login')).toBeInTheDocument()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('renderiza o PaymentWarningBanner', () => {
    authenticateAsAdmin()
    renderLayout()
    expect(screen.getByTestId('payment-warning-banner')).toBeInTheDocument()
  })

  it('renderiza o Outlet (conteúdo das rotas filhas)', () => {
    authenticateAsAdmin()
    renderLayout()
    expect(screen.getByText('outlet')).toBeInTheDocument()
  })
})
