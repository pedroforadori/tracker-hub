import { useEffect, useState } from 'react'
import type { BillingStatus } from '@/shared/types/api'
import { billingApi } from '../api/billing.api'
import { CardUpdateForm } from '../components/CardUpdateForm'

const statusLabel: Record<string, string> = {
  ACTIVE: 'Ativo',
  TRIALING: 'Período de teste',
  PAST_DUE: 'Pagamento pendente',
  BLOCKED: 'Bloqueado',
  CANCELED: 'Cancelado',
}

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300',
  TRIALING: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  PAST_DUE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
  CANCELED: 'bg-muted text-muted-foreground',
}

export function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    billingApi
      .getStatus()
      .then(setStatus)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        Carregando...
      </div>
    )
  }

  const cardInfo =
    status?.lastFour && status?.cardBrand
      ? `${status.cardBrand.charAt(0).toUpperCase() + status.cardBrand.slice(1)} •••• ${status.lastFour}`
      : 'Nenhum cartão cadastrado'

  const trialDaysLeft = status?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(status.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : null

  const graceDaysLeft = status?.gracePeriodEndsAt
    ? Math.max(0, Math.ceil((new Date(status.gracePeriodEndsAt).getTime() - Date.now()) / 86_400_000))
    : null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Cobrança</h1>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Status do plano</h2>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[status?.status ?? ''] ?? 'bg-muted text-muted-foreground'}`}
          >
            {statusLabel[status?.status ?? ''] ?? status?.status}
          </span>
        </div>

        {status?.status === 'TRIALING' && trialDaysLeft !== null && (
          <p className="text-sm text-muted-foreground">
            Período de teste encerra em <strong>{trialDaysLeft} dias</strong>.
          </p>
        )}

        {status?.status === 'PAST_DUE' && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {status.blockReason && <p className="mb-1 font-medium">{status.blockReason}</p>}
            {graceDaysLeft !== null && (
              <p>Regularize em até <strong>{graceDaysLeft} dias</strong> para evitar o bloqueio.</p>
            )}
          </div>
        )}

        {status?.status === 'BLOCKED' && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {status.blockReason && <p>{status.blockReason}</p>}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Forma de pagamento</h2>
        <p className="text-sm text-foreground">{cardInfo}</p>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            {status?.lastFour ? 'Trocar cartão' : 'Adicionar cartão'}
          </button>
        ) : (
          <div className="pt-2">
            <CardUpdateForm />
          </div>
        )}
      </div>
    </div>
  )
}
