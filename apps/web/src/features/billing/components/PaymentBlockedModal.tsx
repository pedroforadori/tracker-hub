import { CreditCard, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/shared/store/authStore'
import { useBillingStore } from '@/shared/store/billingStore'
import { CardUpdateForm } from './CardUpdateForm'

export function PaymentBlockedModal() {
  const { blockMessage } = useBillingStore()
  const { user } = useAuthStore()
  const [showCardForm, setShowCardForm] = useState(false)
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <Lock size={20} className="text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {isAdmin ? 'Falha no pagamento' : 'Acesso bloqueado'}
          </h2>
        </div>

        {isAdmin ? (
          <>
            <p className="mb-2 text-sm text-muted-foreground">
              {blockMessage ?? 'Não foi possível processar o pagamento da sua assinatura.'}
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Atualize sua forma de pagamento para restaurar o acesso imediatamente.
            </p>

            {showCardForm ? (
              <CardUpdateForm />
            ) : (
              <button
                onClick={() => setShowCardForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <CreditCard size={16} />
                Atualizar forma de pagamento
              </button>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Prefere gerenciar pelo painel?{' '}
              <Link to="/billing" className="underline hover:text-foreground">
                Ir para Cobrança
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              O pagamento da assinatura desta conta está pendente. Contate o administrador da conta
              para regularizar o pagamento e restaurar o acesso.
            </p>
            <p className="text-xs text-muted-foreground">
              Se você acredita que isso é um erro, peça ao admin para verificar a seção de
              Cobrança.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
