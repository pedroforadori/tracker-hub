const clients = [
  { name: 'Transvale',        style: 'font-sans font-bold text-2xl tracking-tight' },
  { name: 'Carga & Caminho',  style: 'font-display italic text-3xl' },
  { name: 'RODOLOG /',        style: 'font-mono text-xl tracking-wide' },
  { name: 'PampaCargo',       style: 'font-sans font-bold text-2xl tracking-tight' },
  { name: 'Boiadeiro Express',style: 'font-display italic text-3xl' },
  { name: 'VIAFRETE.BR',      style: 'font-mono text-xl tracking-wide' },
  { name: 'Norteville',       style: 'font-sans font-bold text-2xl tracking-tight' },
]

export function ClientsBar() {
  return (
    <section id="clientes" className="mt-28 border-y border-line px-8 py-14 lg:px-22">
      <p className="text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
        Já gerenciam suas frotas com a TrackerHub
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-7">
        {clients.map(({ name, style }) => (
          <span key={name} className={`${style} text-ink-2 opacity-80`}>
            {name}
          </span>
        ))}
      </div>
    </section>
  )
}
