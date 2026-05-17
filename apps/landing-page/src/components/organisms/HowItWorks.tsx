const steps = [
  {
    title: 'Crie sua conta',
    desc: 'Um e-mail, uma senha. Seu tenant é criado isolado e seu papel ADMIN já fica pronto.',
  },
  {
    title: 'Cadastre clientes e veículos',
    desc: 'Importe da planilha ou cadastre na mão — máscaras de CNPJ, placa e renavam ajudam a não errar.',
  },
  {
    title: 'Pareie rastreador + chip',
    desc: 'Cole o IMEI, vincule o ICCID e aguarde o primeiro ping. Pronto: a operação aparece no painel.',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-line bg-bg-warm-2 px-8 py-24 lg:px-22">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Em 3 passos</p>
          <h2 className="mt-3 max-w-xl font-display text-5xl leading-tight tracking-tight lg:text-7xl">
            Da assinatura ao primeiro rastreador em{' '}
            <em className="italic text-amber-deep">menos de 10 minutos</em>.
          </h2>
        </div>
        <p className="max-w-xs text-base text-ink-2 lg:pb-2">
          Sem implantação consultiva. Sem reunião de kickoff. Sem &ldquo;te ligamos amanhã&rdquo;.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {steps.map(({ title, desc }, i) => (
          <div key={title} className="relative">
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute right-0 top-10 hidden h-px w-7 translate-x-full bg-line-2 lg:block"
              />
            )}
            <p className="font-display text-7xl leading-none tracking-tighter text-amber-deep">
              0{i + 1}
            </p>
            <h3 className="mt-4 font-display text-3xl font-normal leading-tight">{title}</h3>
            <p className="mt-2.5 max-w-xs text-sm text-ink-2">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
