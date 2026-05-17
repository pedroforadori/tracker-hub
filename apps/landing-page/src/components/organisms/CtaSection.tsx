export function CtaSection() {
  return (
    <section
      id="trial"
      className="relative mx-8 mb-20 overflow-hidden rounded-3xl bg-ink px-16 py-20 lg:mx-22"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[radial-gradient(ellipse,oklch(0.65_0.17_50)_0%,transparent_70%)] opacity-40"
      />

      <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="max-w-xl font-display text-5xl leading-tight text-paper lg:text-7xl">
          Sua frota merece uma{' '}
          <em className="italic text-amber">tela só dela</em>. Vamos montá-la.
        </h2>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <a
            href="#trial"
            className="inline-flex items-center gap-2 rounded-full bg-amber-deep px-7 py-4 text-base font-medium text-paper transition-all hover:-translate-y-px hover:opacity-90"
          >
            Começar 14 dias grátis <span className="font-display italic">→</span>
          </a>
          <span className="font-mono text-[11px] uppercase tracking-wider text-paper/60">
            Sem cartão · Cancela em 1 clique
          </span>
        </div>
      </div>
    </section>
  )
}
