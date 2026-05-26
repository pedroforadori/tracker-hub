export default async function ContratadoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  // Delega a validação do Stripe e o envio do e-mail ao endpoint interno da API.
  // A API verifica o session_id diretamente no Stripe antes de enviar qualquer e-mail.
  if (session_id) {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3333'
    const internalSecret = process.env.INTERNAL_API_SECRET ?? ''

    try {
      const res = await fetch(`${apiUrl}/mail/checkout-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify({ sessionId: session_id }),
        cache: 'no-store',
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(`[contratado] checkout-welcome falhou: ${res.status} ${body}`)
      }
    } catch (err) {
      console.error('[contratado] Erro ao chamar checkout-welcome:', err)
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
          Enviamos um e-mail com o link para criar sua conta. Fique de olho na
          caixa de entrada — caso não receba em alguns minutos, verifique o
          spam ou entre em contato com o suporte.
        </p>
      </div>
    </main>
  )
}
