'use client'

import { useState } from 'react'

const plans = [
  {
    period: 'Mensal',
    price: '47',
    billing: 'cobrado mensalmente',
    savings: null,
    featured: false,
  },
  {
    period: 'Trimestral',
    price: '42',
    billing: 'cobrado a cada 3 meses',
    savings: 'Economize 11%',
    featured: false,
  },
  {
    period: 'Anual',
    price: '35',
    billing: 'cobrado anualmente',
    savings: 'Economize 26%',
    featured: true,
  },
]

export function CtaSection() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleCheckout = async (period: string) => {
    setLoadingPlan(period)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      if (!res.ok) throw new Error('checkout request failed')
      const { url, error } = await res.json()
      if (!url || error) throw new Error(error ?? 'no url returned')
      window.location.href = url
    } catch {
      setLoadingPlan(null)
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

      <div className="relative">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-paper/50">Preços · por veículo/mês</p>
          <h2 className="mt-3 font-display text-5xl leading-tight text-paper lg:text-7xl">
            Pronto para{' '}
            <em className="italic text-amber">contratar?</em>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-paper/60">
            Tudo incluso em qualquer período. Quanto mais longo, maior o desconto.
          </p>
        </div>

        <ul className="mx-auto mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2.5">
          {[
            'Veículos ilimitados',
            'Até 3 operadores por conta',
            'Cadastro de clientes, veículos, rastreadores e chips',
            'Telemetria em tempo real a cada 30s',
            'Multi-empresa com isolamento por tenant',
            'API + Webhooks ilimitados',
            'LGPD-ready · SLA 99,9%',
            'Suporte prioritário',
            'Migração de dados em CSV',
          ].map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-paper/70">
              <span className="text-amber">✓</span>
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map(({ period, price, billing, savings, featured }) => {
            const isLoading = loadingPlan === period
            return (
              <div
                key={period}
                className={`relative flex flex-col gap-6 rounded-2xl p-8 ${
                  featured
                    ? 'bg-paper text-ink'
                    : 'border border-paper/15 bg-paper/5 text-paper'
                }`}
              >
                {featured && (
                  <span className="absolute -top-px right-6 rounded-b-md bg-amber px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">
                    Mais vantajoso
                  </span>
                )}

                <div>
                  <p className={`font-mono text-[10.5px] uppercase tracking-widest ${featured ? 'text-amber-deep' : 'text-paper/50'}`}>
                    {period}
                  </p>
                  {savings && (
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${featured ? 'bg-amber/20 text-amber-deep' : 'bg-amber/10 text-amber'}`}>
                      {savings}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-mono text-sm ${featured ? 'text-ink/50' : 'text-paper/40'}`}>R$</span>
                    <span className="font-display text-6xl leading-none tracking-tight">{price}</span>
                  </div>
                  <p className={`mt-1 text-xs ${featured ? 'text-ink/50' : 'text-paper/40'}`}>{billing}</p>
                </div>

                <button
                  onClick={() => handleCheckout(period)}
                  disabled={!!loadingPlan}
                  className={`mt-auto flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${
                    featured
                      ? 'bg-amber-deep text-paper hover:opacity-90'
                      : 'border border-paper/20 text-paper hover:bg-paper/10'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="size-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                      Aguarde...
                    </>
                  ) : (
                    <>Contratar {period} <span className="font-display italic">→</span></>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-wider text-paper/30">
          Pagamento seguro via Stripe · Cancele quando quiser
        </p>
      </div>
    </section>
  )
}
