import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { authenticateAsAdmin } from '@/test/helpers/storeHelpers'
import { blockBilling } from '@/test/helpers/storeHelpers'

vi.mock('../PaymentBlockedModal', () => ({
  PaymentBlockedModal: () => <div data-testid="payment-blocked-modal" />,
}))

// Importar após o mock
const { BillingGate } = await import('../BillingGate')

function renderGate(children = <span>conteúdo</span>) {
  return render(<MemoryRouter><BillingGate>{children}</BillingGate></MemoryRouter>)
}

describe('BillingGate', () => {
  it('não autenticado + não bloqueado → renderiza children normalmente', () => {
    renderGate()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
    expect(screen.queryByTestId('payment-blocked-modal')).not.toBeInTheDocument()
  })

  it('autenticado + não bloqueado → renderiza children normalmente', () => {
    authenticateAsAdmin()
    renderGate()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
    expect(screen.queryByTestId('payment-blocked-modal')).not.toBeInTheDocument()
  })

  it('autenticado + bloqueado → children com opacity-30 + modal', () => {
    authenticateAsAdmin()
    blockBilling()
    renderGate()

    const hiddenContent = screen.getByText('conteúdo').closest('[aria-hidden]')
    expect(hiddenContent).toBeInTheDocument()
    expect(hiddenContent).toHaveClass('opacity-30')
    expect(screen.getByTestId('payment-blocked-modal')).toBeInTheDocument()
  })

  it('autenticado + bloqueado → children com pointer-events-none', () => {
    authenticateAsAdmin()
    blockBilling()
    renderGate()

    const hiddenContent = screen.getByText('conteúdo').closest('[aria-hidden]')
    expect(hiddenContent).toHaveClass('pointer-events-none')
  })

  it('não autenticado + bloqueado (store inconsistente) → children normais', () => {
    blockBilling()
    renderGate()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
    expect(screen.queryByTestId('payment-blocked-modal')).not.toBeInTheDocument()
  })
})
