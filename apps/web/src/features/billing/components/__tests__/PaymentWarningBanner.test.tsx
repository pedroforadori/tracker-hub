import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { authenticateAsAdmin, authenticateAsUser, setPastDue } from '@/test/helpers/storeHelpers'
import { PaymentWarningBanner } from '../PaymentWarningBanner'

function renderBanner() {
  return render(<MemoryRouter><PaymentWarningBanner /></MemoryRouter>)
}

describe('PaymentWarningBanner', () => {
  it('não renderiza quando isPastDue=false', () => {
    authenticateAsAdmin()
    const { container } = renderBanner()
    expect(container.firstChild).toBeNull()
  })

  it('renderiza banner quando isPastDue=true', () => {
    authenticateAsAdmin()
    setPastDue()
    renderBanner()
    expect(screen.getByText(/falha no pagamento/i)).toBeInTheDocument()
  })

  it('exibe deadline formatada em pt-BR quando gracePeriodEndsAt está definido', () => {
    authenticateAsAdmin()
    const graceDate = '2025-12-31T12:00:00Z'
    setPastDue(graceDate)
    renderBanner()
    // O texto é embutido no <span> — buscar por string parcial dentro do elemento
    expect(screen.getByText((_, el) =>
      el?.tagName === 'SPAN' && (el.textContent ?? '').includes('31/12/2025'),
    )).toBeInTheDocument()
  })

  it('ADMIN → exibe link "Atualizar forma de pagamento" para /billing', () => {
    authenticateAsAdmin()
    setPastDue()
    renderBanner()
    const link = screen.getByRole('link', { name: /atualizar forma de pagamento/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/billing')
  })

  it('USER → exibe texto "Contate o administrador" sem link', () => {
    authenticateAsUser()
    setPastDue()
    renderBanner()
    expect(screen.getByText(/contate o administrador/i)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
