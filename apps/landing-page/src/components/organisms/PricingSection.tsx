const features = [
  'Veículos ilimitados',
  'Até 3 operadores por conta (ADMIN + usuários)',
  'Cadastro completo de clientes, veículos, rastreadores e chips',
  'Telemetria em tempo real a cada 30s',
  'Multi-empresa com isolamento total por tenant',
  'API + Webhooks ilimitados',
  'LGPD-ready — dados isolados por conta',
  'Painel de gestão completo com visão unificada',
  'Suporte prioritário por e-mail e chat',
  'Migração de dados em CSV a qualquer momento',
  'SLA de disponibilidade 99,9%',
]

export function PricingSection() {
  return (
    <section id="precos" className="px-8 py-28 lg:px-22">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Preços</p>
          <h2 className="mt-3 max-w-xl font-display text-5xl leading-tight tracking-tight lg:text-7xl">
            Um plano. Tudo incluso.{' '}
            <em className="italic text-amber-deep">Sem letra miúda.</em>
          </h2>
        </div>
        <p className="max-w-xs text-base text-ink-2 lg:pb-2">
          Acesso completo à plataforma desde o primeiro dia. Sem limites artificiais, sem surpresas na fatura.
        </p>
      </div>

      <div className="mt-14 flex justify-center">
        <div className="relative w-full max-w-2xl rounded-2xl border border-ink bg-ink p-10 text-paper">
          <span className="absolute -top-px right-8 rounded-b-md bg-amber px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">
            Plano único
          </span>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
            <div className="shrink-0">
              <p className="font-mono text-[10.5px] uppercase tracking-widest text-amber">Plataforma completa</p>
              <p className="mt-1 font-display text-4xl leading-tight">TrackerHub</p>
              <p className="mt-1.5 text-sm text-paper/75">Tudo que sua frota precisa em um só lugar.</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-mono text-sm text-paper/60">R$</span>
                <span className="font-display text-7xl leading-none tracking-tight">47</span>
                <span className="text-sm text-paper/60">/veículo/mês</span>
              </div>

              <a
                href="#contato"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-amber-deep px-7 py-4 text-base font-medium text-paper transition-all hover:-translate-y-px hover:opacity-90"
              >
                Contratar agora <span className="font-display italic ml-1">→</span>
              </a>
            </div>

            <ul className="flex flex-col gap-3.5 lg:border-l lg:border-paper/15 lg:pl-10">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-paper/80">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 size-4 shrink-0 text-amber"
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
