import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useState } from 'react'
import { useBillingStore } from '@/shared/store/billingStore'
import { billingApi } from '../api/billing.api'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

function CardForm() {
  const stripe = useStripe()
  const elements = useElements()
  const { clearBilling } = useBillingStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      const { clientSecret } = await billingApi.createSetupIntent()

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      })

      if (stripeError) throw new Error(stripeError.message)
      if (!setupIntent?.payment_method) throw new Error('Falha ao confirmar cartão')

      await billingApi.updatePaymentMethod(setupIntent.payment_method as string)

      setSuccess(true)
      setTimeout(() => clearBilling(), 1500)
    } catch (err) {
      setError((err as Error).message ?? 'Erro ao atualizar cartão')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-center text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
        Cartão atualizado com sucesso! Restaurando acesso...
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border border-input bg-background px-3 py-2.5">
        <CardElement
          options={{
            style: {
              base: { fontSize: '14px', color: 'var(--foreground)', '::placeholder': { color: 'var(--muted-foreground)' } },
            },
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Processando...' : 'Confirmar novo cartão'}
      </button>
    </form>
  )
}

export function CardUpdateForm() {
  return (
    <Elements stripe={stripePromise}>
      <CardForm />
    </Elements>
  )
}
