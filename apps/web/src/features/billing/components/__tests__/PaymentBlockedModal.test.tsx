import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { authenticateAsAdmin, authenticateAsUser, blockBilling } from '@/test/helpers/storeHelpers'

vi.mock('../CardUpdateForm', () => ({
  CardUpdateForm: () => <div data-testid="card-update-form" />,
}))

const { PaymentBlockedModal } = await import('../PaymentBlockedModal')

function renderModal() {
  return render(<MemoryRouter><PaymentBlockedModal /></MemoryRouter>)
}

describe('PaymentBlockedModal', () => {
  it('ADMIN → título "Falha no pagamento"', () => {
    authenticateAsAdmin()
    blockBilling()
    renderModal()
    expect(screen.getByRole('heading', { name: /falha no pagamento/i })).toBeInTheDocument()
  })

  it('USER → título "Acesso bloqueado"', () => {
    authenticateAsUser()
    blockBilling()
    renderModal()
    expect(screen.getByRole('heading', { name: /acesso bloqueado/i })).toBeInTheDocument()
  })

  it('ADMIN → exibe botão "Atualizar forma de pagamento"', () => {
    authenticateAsAdmin()
    blockBilling()
    renderModal()
    expect(screen.getByRole('button', { name: /atualizar forma de pagamento/i })).toBeInTheDocument()
  })

  it('USER → sem botão de atualizar cartão', () => {
    authenticateAsUser()
    blockBilling()
    renderModal()
    expect(screen.queryByRole('button', { name: /atualizar forma de pagamento/i })).not.toBeInTheDocument()
  })

  it('ADMIN → clicar no botão exibe CardUpdateForm', async () => {
    const user = userEvent.setup()
    authenticateAsAdmin()
    blockBilling()
    renderModal()

    await user.click(screen.getByRole('button', { name: /atualizar forma de pagamento/i }))
    expect(screen.getByTestId('card-update-form')).toBeInTheDocument()
  })

  it('exibe blockMessage do billingStore', () => {
    authenticateAsAdmin()
    blockBilling('Cartão com saldo insuficiente')
    renderModal()
    expect(screen.getByText(/cartão com saldo insuficiente/i)).toBeInTheDocument()
  })

  it('link "Ir para Cobrança" aponta para /billing', () => {
    authenticateAsAdmin()
    blockBilling()
    renderModal()
    expect(screen.getByRole('link', { name: /ir para cobrança/i })).toHaveAttribute('href', '/billing')
  })
})
