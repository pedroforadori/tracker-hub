import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/msw/server'
import { activeStatus, blockedStatus, pastDueStatus, trialingStatus } from '@/test/fixtures/billing.fixtures'
import { BillingPage } from '../BillingPage'

const BASE = 'http://localhost:3333'

vi.mock('../../components/CardUpdateForm', () => ({
  CardUpdateForm: () => <div data-testid="card-update-form" />,
}))

function renderPage() {
  return render(<MemoryRouter><BillingPage /></MemoryRouter>)
}

describe('BillingPage', () => {
  it('exibe "Carregando..." inicialmente', () => {
    renderPage()
    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('status ACTIVE → badge "Ativo"', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())
  })

  it('status TRIALING → badge "Período de teste" + dias restantes', async () => {
    server.use(http.get(`${BASE}/billing/status`, () => HttpResponse.json(trialingStatus)))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Período de teste')).toBeInTheDocument()
      expect(screen.getByText(/dias/i)).toBeInTheDocument()
    })
  })

  it('status PAST_DUE → badge "Pagamento pendente" + motivo', async () => {
    server.use(http.get(`${BASE}/billing/status`, () => HttpResponse.json(pastDueStatus)))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Pagamento pendente')).toBeInTheDocument()
      expect(screen.getByText(pastDueStatus.blockReason!)).toBeInTheDocument()
    })
  })

  it('status BLOCKED → badge "Bloqueado" + blockReason', async () => {
    server.use(http.get(`${BASE}/billing/status`, () => HttpResponse.json(blockedStatus)))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Bloqueado')).toBeInTheDocument()
      expect(screen.getByText(blockedStatus.blockReason!)).toBeInTheDocument()
    })
  })

  it('com cartão → exibe "Visa •••• 4242"', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('Visa •••• 4242')).toBeInTheDocument())
  })

  it('sem cartão → exibe "Nenhum cartão cadastrado"', async () => {
    server.use(http.get(`${BASE}/billing/status`, () => HttpResponse.json({ ...activeStatus, lastFour: null, cardBrand: null })))
    renderPage()
    await waitFor(() => expect(screen.getByText('Nenhum cartão cadastrado')).toBeInTheDocument())
  })

  it('botão "Trocar cartão" → exibe CardUpdateForm', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /trocar cartão/i }))
    await user.click(screen.getByRole('button', { name: /trocar cartão/i }))
    expect(screen.getByTestId('card-update-form')).toBeInTheDocument()
  })

  it('sem cartão → botão "Adicionar cartão"', async () => {
    server.use(http.get(`${BASE}/billing/status`, () => HttpResponse.json({ ...activeStatus, lastFour: null, cardBrand: null })))
    renderPage()
    await waitFor(() => expect(screen.getByRole('button', { name: /adicionar cartão/i })).toBeInTheDocument())
  })
})
