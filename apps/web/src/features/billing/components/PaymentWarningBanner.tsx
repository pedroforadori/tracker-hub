import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/shared/store/authStore'
import { useBillingStore } from '@/shared/store/billingStore'

export function PaymentWarningBanner() {
  const { isPastDue, gracePeriodEndsAt } = useBillingStore()
  const { user } = useAuthStore()

  if (!isPastDue) return null

  const deadline = gracePeriodEndsAt
    ? new Date(gracePeriodEndsAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null

  return (
    <div className="flex items-center gap-3 border-b border-amber-300 bg-amber-50 px-6 py-2.5 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
      <AlertTriangle size={16} className="shrink-0" />
      <span>
        Há uma falha no pagamento da sua conta.
        {deadline && ` Regularize até ${deadline} para evitar bloqueio.`}
      </span>
      {user?.role === 'ADMIN' ? (
        <Link
          to="/billing"
          className="ml-auto shrink-0 rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
        >
          Atualizar forma de pagamento
        </Link>
      ) : (
        <span className="ml-auto shrink-0 text-xs opacity-70">
          Contate o administrador da conta.
        </span>
      )}
    </div>
  )
}
