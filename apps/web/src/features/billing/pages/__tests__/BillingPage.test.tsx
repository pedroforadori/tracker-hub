import { Suspense } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  activeStatus,
  blockedStatus,
  pastDueStatus,
  trialingStatus,
} from '@/test/fixtures/billing.fixtures'

// Mock billingApi BEFORE importing BillingPage so the module-level promise is
// created against the mock (same pattern as CustomersPage tests).
const mockGetStatus = vi.fn().mockResolvedValue(activeStatus)
const mockCreateSetupIntent = vi.fn()
const mockUpdatePaymentMethod = vi.fn()

vi.mock('../../api/billing.api', () => ({
  billingApi: {
    getStatus: () => mockGetStatus(),
    createSetupIntent: () => mockCreateSetupIntent(),
    updatePaymentMethod: (id: string) => mockUpdatePaymentMethod(id),
  },
}))

vi.mock('../../components/CardUpdateForm', () => ({
  CardUpdateForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="card-update-form">
      <button onClick={onSuccess}>mock-success</button>
    </div>
  ),
}))

// Dynamic import AFTER mocks are set up — ensures the module-level promise is
// created with the mocked billingApi (same pattern as CustomersPage).
const { BillingContent, __resetStatusPromise } = await import('../BillingPage')

beforeEach(() => {
  mockGetStatus.mockReset()
  mockGetStatus.mockResolvedValue(activeStatus)
  __resetStatusPromise()
})

/**
 * Renders BillingContent inside a Suspense boundary and flushes all pending
 * React 19 async operations (promise resolutions, concurrent updates) via
 * `act()` before returning. Required because React 19's `use()` hook may
 * schedule re-renders outside of the synchronous render cycle.
 */
async function renderContent(
  onRefresh = vi.fn(),
  extra: { readOnly?: boolean; asSection?: boolean } = {},
) {
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(
      <MemoryRouter>
        <Suspense fallback={<div>Carregando...</div>}>
          <BillingContent onRefresh={onRefresh} {...extra} />
        </Suspense>
      </MemoryRouter>,
    )
  })
  return result!
}

describe('BillingPage — BillingContent', () => {
  it('exibe "Carregando..." enquanto a promise resolve (Suspense fallback)', async () => {
    // Never-resolving promise keeps Suspense in fallback state
    mockGetStatus.mockImplementation(() => new Promise(() => {}))
    __resetStatusPromise()
    // Do NOT await act — check synchronously before promise resolves
    render(
      <MemoryRouter>
        <Suspense fallback={<div>Carregando...</div>}>
          <BillingContent onRefresh={vi.fn()} />
        </Suspense>
      </MemoryRouter>,
    )
    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('status ACTIVE → badge "Ativo"', async () => {
    await renderContent()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('status TRIALING → badge "Período de teste" + dias restantes', async () => {
    mockGetStatus.mockResolvedValue(trialingStatus)
    __resetStatusPromise()
    await renderContent()
    expect(screen.getByText('Período de teste')).toBeInTheDocument()
    expect(screen.getByText(/dias/i)).toBeInTheDocument()
  })

  it('status PAST_DUE → badge "Pagamento pendente" + motivo', async () => {
    mockGetStatus.mockResolvedValue(pastDueStatus)
    __resetStatusPromise()
    await renderContent()
    expect(screen.getByText('Pagamento pendente')).toBeInTheDocument()
    expect(screen.getByText(pastDueStatus.blockReason!)).toBeInTheDocument()
  })

  it('status BLOCKED → badge "Bloqueado" + blockReason', async () => {
    mockGetStatus.mockResolvedValue(blockedStatus)
    __resetStatusPromise()
    await renderContent()
    expect(screen.getByText('Bloqueado')).toBeInTheDocument()
    expect(screen.getByText(blockedStatus.blockReason!)).toBeInTheDocument()
  })

  it('com cartão → exibe "Visa •••• 4242"', async () => {
    await renderContent()
    expect(screen.getByText('Visa •••• 4242')).toBeInTheDocument()
  })

  it('sem cartão → exibe "Nenhum cartão cadastrado"', async () => {
    mockGetStatus.mockResolvedValue({ ...activeStatus, lastFour: null, cardBrand: null })
    __resetStatusPromise()
    await renderContent()
    expect(screen.getByText('Nenhum cartão cadastrado')).toBeInTheDocument()
  })

  it('botão "Trocar cartão" → exibe CardUpdateForm', async () => {
    const user = userEvent.setup()
    await renderContent()
    await user.click(screen.getByRole('button', { name: /trocar cartão/i }))
    expect(screen.getByTestId('card-update-form')).toBeInTheDocument()
  })

  it('sem cartão → botão "Adicionar cartão"', async () => {
    mockGetStatus.mockResolvedValue({ ...activeStatus, lastFour: null, cardBrand: null })
    __resetStatusPromise()
    await renderContent()
    expect(screen.getByRole('button', { name: /adicionar cartão/i })).toBeInTheDocument()
  })

  it('erro na API → exibe mensagem de erro com botão "Tentar novamente"', async () => {
    mockGetStatus.mockRejectedValue(new Error('Network error'))
    __resetStatusPromise()
    await renderContent()
    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })

  it('"Tentar novamente" chama onRefresh', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    mockGetStatus.mockRejectedValue(new Error('fail'))
    __resetStatusPromise()
    await renderContent(onRefresh)
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('readOnly=true → oculta botão "Trocar cartão"', async () => {
    await renderContent(vi.fn(), { readOnly: true })
    expect(screen.queryByRole('button', { name: /trocar cartão/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /adicionar cartão/i })).not.toBeInTheDocument()
  })

  it('readOnly=true → oculta "Tentar novamente" no estado de erro', async () => {
    mockGetStatus.mockRejectedValue(new Error('fail'))
    __resetStatusPromise()
    await renderContent(vi.fn(), { readOnly: true })
    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /tentar novamente/i })).not.toBeInTheDocument()
  })

  it('asSection=true → não renderiza h1 "Cobrança"', async () => {
    await renderContent(vi.fn(), { asSection: true })
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })

  it('asSection=true → sub-headings são h3', async () => {
    await renderContent(vi.fn(), { asSection: true })
    const h3s = screen.getAllByRole('heading', { level: 3 })
    expect(h3s.some((el) => /status do plano/i.test(el.textContent ?? ''))).toBe(true)
    expect(h3s.some((el) => /forma de pagamento/i.test(el.textContent ?? ''))).toBe(true)
  })
})
