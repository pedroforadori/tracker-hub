const plans = [
  {
    tag: 'Solo',
    name: 'Cabine',
    sub: 'Para quem está começando.',
    price: '29',
    unit: '/veículo/mês',
    featured: false,
    features: [
      'Até 25 veículos',
      '1 operador (ADMIN)',
      'Telemetria a cada 60s',
      'Suporte por e-mail',
    ],
    cta: 'Contratar Cabine',
    ctaHref: '#contato',
  },
  {
    tag: 'Recomendado',
    name: 'Carreta',
    sub: 'A linha que cobre a operação inteira.',
    price: '19',
    unit: '/veículo/mês',
    featured: true,
    features: [
      'Até 500 veículos',
      '3 operadores (ADMIN + 3)',
      'Telemetria a cada 30s',
      'API + Webhooks ilimitados',
      'Suporte prioritário',
    ],
    cta: 'Contratar Carreta',
    ctaHref: '#contato',
  },
  {
    tag: 'Escala',
    name: 'Comboio',
    sub: 'Para frotas grandes com SLA.',
    price: null,
    unit: 'consulta',
    featured: false,
    features: [
      'Veículos ilimitados',
      'SSO + multi-tenant federado',
      'SLA 99,95% contratual',
      'Gerente de conta dedicado',
    ],
    cta: 'Falar com vendas',
    ctaHref: '#contato',
  },
]

export function PricingSection() {
  return (
    <section id="precos" className="px-8 py-28 lg:px-22">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Preços</p>
          <h2 className="mt-3 max-w-xl font-display text-5xl leading-tight tracking-tight lg:text-7xl">
            Por veículo monitorado.{' '}
            <em className="italic text-amber-deep">Sem letra miúda.</em>
          </h2>
        </div>
        <p className="max-w-xs text-base text-ink-2 lg:pb-2">
          Pague pelo que você usa. Cancele quando quiser. Migre seus dados em CSV a qualquer momento.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col gap-5 rounded-2xl border p-8 ${
              plan.featured
                ? 'border-ink bg-ink text-paper'
                : 'border-line bg-paper'
            }`}
          >
            {plan.featured && (
              <span className="absolute -top-px right-6 rounded-b-md bg-amber px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">
                Mais escolhido
              </span>
            )}

            <div>
              <p className={`font-mono text-[10.5px] uppercase tracking-widest ${plan.featured ? 'text-amber' : 'text-ink-3'}`}>
                {plan.tag}
              </p>
              <p className="mt-1 font-display text-4xl leading-tight">{plan.name}</p>
              <p className={`mt-1.5 text-sm ${plan.featured ? 'text-paper/75' : 'text-ink-2'}`}>{plan.sub}</p>
            </div>

            <div className="flex items-baseline gap-1.5">
              {plan.price ? (
                <>
                  <span className={`font-mono text-sm ${plan.featured ? 'text-paper/60' : 'text-ink-3'}`}>R$</span>
                  <span className="font-display text-6xl leading-none tracking-tight">{plan.price}</span>
                  <span className={`text-sm ${plan.featured ? 'text-paper/60' : 'text-ink-3'}`}>{plan.unit}</span>
                </>
              ) : (
                <>
                  <span className="font-display text-5xl leading-none tracking-tight">Sob</span>
                  <span className={`text-sm ${plan.featured ? 'text-paper/60' : 'text-ink-3'}`}>{plan.unit}</span>
                </>
              )}
            </div>

            <ul className="flex flex-col gap-3">
              {plan.features.map((f) => (
                <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.featured ? 'text-paper/80' : 'text-ink-2'}`}>
                  <CheckIcon featured={plan.featured} />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={plan.ctaHref}
              className={`mt-auto flex w-full items-center justify-center rounded-full py-3.5 text-sm font-medium transition-all hover:-translate-y-px ${
                plan.featured
                  ? 'bg-amber-deep text-paper hover:opacity-90'
                  : 'border border-line-2 text-ink hover:bg-bg-warm-2'
              }`}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}

function CheckIcon({ featured }: { featured: boolean }) {
  return (
    <svg
      className={`mt-0.5 size-4 shrink-0 ${featured ? 'text-amber' : 'text-amber-deep'}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
