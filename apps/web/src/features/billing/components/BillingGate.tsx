import { useAuthStore } from '@/shared/store/authStore'
import { useBillingStore } from '@/shared/store/billingStore'
import { PaymentBlockedModal } from './PaymentBlockedModal'

interface BillingGateProps {
  children: React.ReactNode
}

export function BillingGate({ children }: BillingGateProps) {
  const { isAuthenticated } = useAuthStore()
  const { isBlocked } = useBillingStore()

  return (
    <>
      {isAuthenticated && isBlocked && (
        <>
          {/* Content is visible but non-interactive while blocked */}
          <div className="pointer-events-none select-none opacity-30" aria-hidden>
            {children}
          </div>
          <PaymentBlockedModal />
        </>
      )}
      {(!isAuthenticated || !isBlocked) && children}
    </>
  )
}
