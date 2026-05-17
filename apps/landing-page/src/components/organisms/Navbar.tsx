'use client'

import { LogoMark } from '../atoms/LogoMark'
import { useAppContext } from '../../context/AppContext'

const NAV_LINKS = [
  { label: 'Recursos', href: '#recursos' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Preços', href: '#precos' },
  { label: 'Clientes', href: '#clientes' },
]

export function Navbar() {
  const { isMenuOpen, toggleMenu, closeMenu } = useAppContext()

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg-warm/90 backdrop-blur-sm">
      <nav
        className="flex items-center justify-between px-8 py-5 lg:px-22"
        aria-label="Navegação principal"
      >
        <a href="#" className="flex items-center gap-2.5 font-semibold tracking-tight text-ink" aria-label="TrackerHub">
          <LogoMark />
          TrackerHub
        </a>

        <ul className="hidden items-center gap-8 lg:flex" role="list">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                className="text-sm text-ink-2 transition-colors hover:text-ink"
                onClick={closeMenu}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2.5 lg:flex">
          <a
            href="http://localhost:5173"
            className="px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
          >
            Entrar
          </a>
          <a
            href="#trial"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-all hover:-translate-y-px hover:bg-ink-2"
          >
            Começar grátis <span className="font-display italic">→</span>
          </a>
        </div>

        <button
          className="flex flex-col gap-1.5 p-2 lg:hidden"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          onClick={toggleMenu}
        >
          <span className={`block h-px w-5 bg-ink transition-transform ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-px w-5 bg-ink transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-px w-5 bg-ink transition-transform ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </nav>

      {isMenuOpen && (
        <div className="border-t border-line bg-bg-warm px-8 pb-6 pt-4 lg:hidden">
          <ul className="flex flex-col gap-4" role="list">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <a href={href} className="text-sm text-ink-2 hover:text-ink" onClick={closeMenu}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3">
            <a href="http://localhost:5173" className="text-sm text-ink-2 hover:text-ink">Entrar</a>
            <a
              href="#trial"
              className="flex w-full items-center justify-center rounded-full bg-ink py-3 text-sm font-medium text-paper"
            >
              Começar grátis
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
