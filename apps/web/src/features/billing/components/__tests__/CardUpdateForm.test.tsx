import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mocks declarados antes de qualquer import do módulo testado
const mockCreateSetupIntent = vi.fn()
const mockUpdatePaymentMethod = vi.fn()
const mockConfirmCardSetup = vi.fn()
const mockGetElement = vi.fn()

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CardElement: () => <div data-testid="card-element" />,
  useStripe: () => ({ confirmCardSetup: mockConfirmCardSetup }),
  useElements: () => ({ getElement: mockGetElement }),
}))

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({}) }))

vi.mock('../../api/billing.api', () => ({
  billingApi: {
    createSetupIntent: () => mockCreateSetupIntent(),
    updatePaymentMethod: (id: string) => mockUpdatePaymentMethod(id),
    getStatus: vi.fn(),
  },
}))

import { CardUpdateForm } from '../CardUpdateForm'
import { useBillingStore } from '@/shared/store/billingStore'

describe('CardUpdateForm', () => {
  beforeEach(() => {
    mockGetElement.mockReturnValue({ /* card element mock */ })
    mockCreateSetupIntent.mockResolvedValue({ clientSecret: 'seti_test_secret' })
    mockConfirmCardSetup.mockResolvedValue({ setupIntent: { payment_method: 'pm_test_123' }, error: null })
    mockUpdatePaymentMethod.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza CardElement', () => {
    render(<CardUpdateForm />)
    expect(screen.getByTestId('card-element')).toBeInTheDocument()
  })

  it('botão "Confirmar novo cartão" está habilitado inicialmente', () => {
    render(<CardUpdateForm />)
    expect(screen.getByRole('button', { name: /confirmar novo cartão/i })).not.toBeDisabled()
  })

  it('submit bem-sucedido → chama createSetupIntent, confirmCardSetup e updatePaymentMethod', async () => {
    const user = userEvent.setup()
    render(<CardUpdateForm />)

    await user.click(screen.getByRole('button', { name: /confirmar novo cartão/i }))

    await waitFor(() => {
      expect(mockCreateSetupIntent).toHaveBeenCalledTimes(1)
      expect(mockConfirmCardSetup).toHaveBeenCalledWith('seti_test_secret', expect.any(Object))
      expect(mockUpdatePaymentMethod).toHaveBeenCalledWith('pm_test_123')
    })
  })

  it('após sucesso → exibe mensagem de sucesso', async () => {
    const user = userEvent.setup()
    render(<CardUpdateForm />)

    await user.click(screen.getByRole('button', { name: /confirmar novo cartão/i }))

    await waitFor(() =>
      expect(screen.getByText(/cartão atualizado com sucesso/i)).toBeInTheDocument(),
    )
  })

  it('após sucesso → chama clearBilling() após 1500ms', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })

    render(<CardUpdateForm />)
    await user.click(screen.getByRole('button', { name: /confirmar novo cartão/i }))

    await waitFor(() => expect(mockUpdatePaymentMethod).toHaveBeenCalled())

    useBillingStore.setState({ isBlocked: true, blockMessage: 'teste' })
    vi.advanceTimersByTime(1500)

    await waitFor(() => expect(useBillingStore.getState().isBlocked).toBe(false))

    vi.useRealTimers()
  })

  it('erro do Stripe → exibe mensagem de erro', async () => {
    mockConfirmCardSetup.mockResolvedValue({
      setupIntent: null,
      error: { message: 'Cartão recusado pelo banco' },
    })
    const user = userEvent.setup()
    render(<CardUpdateForm />)

    await user.click(screen.getByRole('button', { name: /confirmar novo cartão/i }))

    await waitFor(() =>
      expect(screen.getByText(/cartão recusado pelo banco/i)).toBeInTheDocument(),
    )
  })

  it('erro da API → exibe mensagem genérica', async () => {
    mockUpdatePaymentMethod.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<CardUpdateForm />)

    await user.click(screen.getByRole('button', { name: /confirmar novo cartão/i }))

    await waitFor(() =>
      expect(screen.getByText(/network error/i)).toBeInTheDocument(),
    )
  })
})
