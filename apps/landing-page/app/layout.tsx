import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AppProvider } from '../src/context/AppContext'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
}

export const metadata: Metadata = {
  title: { default: 'Tracker Hub', template: '%s | Tracker Hub' },
  description: 'Plataforma de rastreamento veicular para frotas e clientes. Controle total, em tempo real.',
  keywords: ['rastreamento veicular', 'GPS', 'frota', 'tracker', 'MicroSaaS'],
  authors: [{ name: 'Tracker Hub' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://trackerhub.com.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Tracker Hub',
    title: 'Tracker Hub — Rastreamento Veicular Simplificado',
    description: 'Gerencie sua frota, clientes e rastreadores em um único lugar.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tracker Hub',
    description: 'Rastreamento veicular para frotas e clientes.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
