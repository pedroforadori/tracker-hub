'use client'

import { useState } from 'react'

const highlights = [
  'Veículos ilimitados',
  'Até 3 operadores por conta',
  'Telemetria em tempo real a cada 30s',
  'Suporte prioritário',
  'LGPD-ready · SLA 99,9%',
]

export function CtaSection() {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <section
      id="contato"
      className="relative mx-8 mb-20 overflow-hidden rounded-3xl bg-ink px-16 py-20 lg:mx-22"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[radial-gradient(ellipse,oklch(0.65_0.17_50)_0%,transparent_70%)] opacity-40"
      />

      <div className="relative flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="font-display text-5xl leading-tight text-paper lg:text-7xl">
            Pronto para{' '}
            <em className="italic text-amber">contratar?</em>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-paper/70">
            Um plano único com tudo incluso. Sem limite artificial, sem surpresa na fatura.
          </p>
          <ul className="mt-6 flex flex-col gap-2.5">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-2.5 text-sm text-paper/80">
                <span className="text-amber">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-4 lg:items-end">
          <div className="text-center lg:text-right">
            <p className="font-mono text-[11px] uppercase tracking-widest text-paper/50">Plano único</p>
            <p className="mt-1 font-display text-6xl leading-none tracking-tight text-paper">
              R$<span className="text-amber">47</span>
            </p>
            <p className="mt-1 text-sm text-paper/50">/veículo/mês</p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="inline-flex min-w-64 items-center justify-center gap-2 rounded-full bg-amber-deep px-8 py-4 text-base font-medium text-paper transition-all hover:-translate-y-px hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper" />
                Aguarde...
              </>
            ) : (
              <>
                Contratar agora <span className="font-display italic">→</span>
              </>
            )}
          </button>

          <p className="font-mono text-[11px] uppercase tracking-wider text-paper/40">
            Pagamento seguro via Stripe
          </p>
        </div>
      </div>
    </section>
  )
}
