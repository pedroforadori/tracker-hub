import type { Metadata, Viewport } from 'next'
import { Geist, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { AppProvider } from '../src/context/AppContext'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#131211',
}

export const metadata: Metadata = {
  title: {
    default: 'TrackerHub — Gestão de frotas que cabe no bolso da operação',
    template: '%s | TrackerHub',
  },
  description:
    'Plataforma brasileira de gestão de frotas. Cadastro de clientes, veículos, rastreadores e chips em um só lugar. Multi-empresa, LGPD-ready, telemetria em tempo real.',
  keywords: [
    'gestão de frotas',
    'rastreamento veicular',
    'GPS frota',
    'SaaS transporte',
    'rastreador veicular',
    'telemetria',
    'LGPD',
    'multi-tenant',
    'TrackerHub',
  ],
  authors: [{ name: 'TrackerHub' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://trackerhub.com.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'TrackerHub',
    title: 'TrackerHub — Gestão de frotas que cabe no bolso da operação',
    description:
      'Cadastro de clientes, veículos, rastreadores e chips em um só lugar. Telemetria a cada 30s, isolamento por tenant, LGPD-ready.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrackerHub — Gestão de frotas',
    description: 'Plataforma de gestão de frotas: clientes, veículos, rastreadores e chips.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
