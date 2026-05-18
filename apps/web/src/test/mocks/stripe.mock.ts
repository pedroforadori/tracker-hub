import { vi } from 'vitest'

export const mockConfirmCardSetup = vi.fn().mockResolvedValue({
  setupIntent: { payment_method: 'pm_test_mock_123' },
  error: null,
})

export const mockStripe = {
  confirmCardSetup: mockConfirmCardSetup,
}

export const mockElements = {
  getElement: vi.fn().mockReturnValue({ /* mock card element */ }),
}

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CardElement: () => <div data-testid="card-element" />,
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}))
