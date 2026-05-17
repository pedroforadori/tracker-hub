import { LogoMark } from '../atoms/LogoMark'

const columns = [
  {
    title: 'Produto',
    links: [
      { label: 'Recursos', href: '#recursos' },
      { label: 'Preços', href: '#precos' },
      { label: 'Changelog', href: '#' },
      { label: 'Roadmap', href: '#' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre', href: '#' },
      { label: 'Carreiras', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Imprensa', href: '#' },
    ],
  },
  {
    title: 'Desenvolvedores',
    links: [
      { label: 'Documentação', href: '#' },
      { label: 'API REST', href: '#' },
      { label: 'Webhooks', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Termos', href: '#' },
      { label: 'Privacidade', href: '#' },
      { label: 'LGPD', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-8 pb-8 pt-16 lg:px-22">
      <div className="grid grid-cols-2 gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 lg:col-span-1">
          <a href="#" className="flex items-center gap-2.5 font-semibold text-ink" aria-label="TrackerHub">
            <LogoMark />
            TrackerHub
          </a>
          <p className="mt-4 max-w-xs text-sm text-ink-2">
            Plataforma brasileira de gestão de frotas. Feita por quem entende de asfalto, código e prazo de entrega.
          </p>
        </div>

        {columns.map(({ title, links }) => (
          <div key={title}>
            <h2 className="mb-3.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">{title}</h2>
            <ul className="flex flex-col gap-2.5">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-ink-2 transition-colors hover:text-ink">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-col gap-2 border-t border-line pt-5 font-mono text-[11px] tracking-wide text-ink-3 lg:flex-row lg:justify-between">
        <span>© 2026 TrackerHub Tecnologia LTDA · CNPJ 00.000.000/0001-00</span>
        <span>FEITO NO BRASIL · v2.6.1</span>
      </div>
    </footer>
  )
}
