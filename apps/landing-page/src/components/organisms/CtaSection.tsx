import { ContactForm } from './ContactForm'

export function CtaSection() {
  return (
    <section
      id="contato"
      className="relative mx-8 mb-20 overflow-hidden rounded-3xl bg-ink px-16 py-20 lg:mx-22"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[radial-gradient(ellipse,oklch(0.65_0.17_50)_0%,transparent_70%)] opacity-40"
      />

      <div className="relative flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
        <div className="max-w-xl">
          <h2 className="font-display text-5xl leading-tight text-paper lg:text-7xl">
            Pronto para{' '}
            <em className="italic text-amber">contratar?</em>{' '}
            Fale com a gente.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-paper/70">
            Nossa equipe entra em contato para entender a operação e configurar o plano ideal para sua frota.
          </p>
        </div>

        <div className="w-full max-w-md rounded-2xl bg-paper p-8 lg:ml-auto">
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
