import { DashboardMockup } from './DashboardMockup'

export function HeroSection() {
  return (
    <section id="hero" className="px-8 pb-16 pt-20 lg:px-22 lg:pt-22">
      <span className="inline-flex items-center gap-2.5 rounded-full border border-line-2 bg-paper px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-2">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-green opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-brand-green" />
        </span>
        Plataforma de gestão de frotas · v2.6
      </span>

      <h1 className="mt-7 max-w-5xl font-display text-6xl leading-none tracking-tight lg:text-8xl">
        Sua frota inteira{' '}
        <em className="italic text-amber-deep">numa tela só</em>
        {' '}—<br />
        sem planilhas, sem{' '}
        <span className="relative inline-block">
          caos
          <span
            aria-hidden="true"
            className="absolute -left-1 -right-1 top-[55%] h-1.5 -rotate-1 rounded bg-amber opacity-80"
          />
        </span>
        , sem suposição.
      </h1>

      <div className="mt-4 flex flex-col gap-10 lg:mt-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
            Cadastro de clientes, veículos, rastreadores e chips em um só lugar. Multi-empresa,
            com isolamento por tenant e até 3 operadores por conta — feito para transportadoras
            que crescem.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#contato"
              className="inline-flex items-center gap-2 rounded-full bg-amber-deep px-5 py-3.5 text-base font-medium text-paper transition-all hover:-translate-y-px hover:opacity-90"
            >
              Contratar agora <span className="font-display italic">→</span>
            </a>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-full border border-line-2 px-5 py-3.5 text-base font-medium text-ink transition-all hover:-translate-y-px hover:bg-bg-warm-2"
            >
              <PlayIcon /> Ver demo (2 min)
            </a>
          </div>
        </div>

        <div className="flex gap-7 text-sm text-ink-2 lg:pb-1">
          <div>
            <ShieldIcon />
            <p className="mt-1.5">
              <strong className="font-semibold text-ink">LGPD-ready</strong><br />
              Isolamento por tenant
            </p>
          </div>
          <div>
            <RefreshIcon />
            <p className="mt-1.5">
              <strong className="font-semibold text-ink">Tempo real</strong><br />
              Telemetria a cada 30s
            </p>
          </div>
          <div>
            <ChartIcon />
            <p className="mt-1.5">
              <strong className="font-semibold text-ink">+38% de eficiência</strong><br />
              na operação dos clientes
            </p>
          </div>
        </div>
      </div>

      <DashboardMockup />
    </section>
  )
}

function PlayIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="size-5 text-amber-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5z" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg className="size-5 text-amber-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 4 21 10 15 10" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="size-5 text-amber-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="m7 14 4-4 4 4 5-7" />
    </svg>
  )
}
