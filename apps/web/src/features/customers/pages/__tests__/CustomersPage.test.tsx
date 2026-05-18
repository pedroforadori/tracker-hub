import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { customersList, customer1 } from '@/test/fixtures/customers.fixtures'

// Mock do módulo de API para evitar problemas com promise no escopo do módulo
const mockGetAll = vi.fn().mockResolvedValue(customersList)
const mockCreate = vi.fn().mockResolvedValue(customer1)
const mockUpdate = vi.fn().mockResolvedValue(customer1)
const mockRemove = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/customers/api/customers.api', () => ({
  customersApi: {
    getAll: () => mockGetAll(),
    create: (d: unknown) => mockCreate(d),
    update: (id: string, d: unknown) => mockUpdate(id, d),
    remove: (id: string) => mockRemove(id),
  },
}))

const { CustomersPage } = await import('../CustomersPage')

beforeEach(() => {
  mockGetAll.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockRemove.mockReset()
  mockGetAll.mockResolvedValue(customersList)
  mockCreate.mockResolvedValue(customer1)
  mockUpdate.mockResolvedValue(customer1)
  mockRemove.mockResolvedValue(undefined)
  vi.mocked(window.confirm).mockReset()
  vi.mocked(window.confirm).mockReturnValue(true)
})

function renderPage() {
  return render(
    <MemoryRouter>
      <Suspense fallback={<div>loading</div>}>
        <CustomersPage />
      </Suspense>
    </MemoryRouter>,
  )
}

describe('CustomersPage', () => {
  it('exibe skeleton/loading enquanto carrega', () => {
    renderPage()
    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('após carregar → exibe lista de clientes', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(customersList[0].name)).toBeInTheDocument()
      expect(screen.getByText(customersList[1].name)).toBeInTheDocument()
    })
  })

  it('botão "+ Novo Cliente" abre o formulário', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /novo cliente/i }))
    await user.click(screen.getByRole('button', { name: /novo cliente/i }))
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument()
  })

  it('clique em Editar → abre formulário com dados do cliente', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getAllByRole('button', { name: /editar/i }))
    await user.click(screen.getAllByRole('button', { name: /editar/i })[0])
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
    expect(screen.getByDisplayValue(customersList[0].name)).toBeInTheDocument()
  })

  it('clique em Excluir com confirm=true → chama remove e atualiza lista', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(true)
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getAllByRole('button', { name: /excluir/i }))
    await user.click(screen.getAllByRole('button', { name: /excluir/i })[0])
    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(customersList[0].id))
  })

  it('clique em Excluir com confirm=false → NÃO chama remove', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false)
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getAllByRole('button', { name: /excluir/i }))
    await user.click(screen.getAllByRole('button', { name: /excluir/i })[0])
    expect(mockRemove).not.toHaveBeenCalled()
  })
})
