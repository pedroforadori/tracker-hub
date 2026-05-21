import Stripe from 'stripe'

export default async function ContratadoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const session = await stripe.checkout.sessions.retrieve(session_id)
      const email = session.customer_details?.email

      if (email && session.payment_status === 'paid') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'
        await fetch(`${apiUrl}/mail/checkout-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
          cache: 'no-store',
        }).catch(() => {})
      }
    } catch {
      // não bloqueia a página de sucesso em caso de falha
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-warm px-8 text-center">
      <div className="max-w-lg">
        <div className="mx-auto mb-8 grid size-20 place-items-center rounded-full bg-amber text-4xl">
          ✓
        </div>
        <h1 className="font-display text-5xl leading-tight tracking-tight lg:text-6xl">
          Contratação realizada{' '}
          <em className="italic text-amber-deep">com sucesso!</em>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-ink-2">
          Enviamos um e-mail com o link para criar sua conta. Fique de olho na caixa de entrada.
        </p>
      </div>
    </main>
  )
}
