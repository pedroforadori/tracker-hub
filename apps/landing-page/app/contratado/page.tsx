const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:5173'

export default function ContratadoPage() {
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
          Nossa equipe vai entrar em contato em breve para configurar sua conta. Fique de olho no e-mail.
        </p>
        {/* <a
          href={WEB_APP_URL}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-base font-medium text-paper transition-all hover:-translate-y-px hover:bg-ink-2"
        >
          Acessar o painel <span className="font-display italic">→</span>
        </a> */}
      </div>
    </main>
  )
}
