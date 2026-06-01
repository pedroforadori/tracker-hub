import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { vehiclesList, vehicle1 } from '@/test/fixtures/vehicles.fixtures'

const mockGetAll = vi.fn().mockResolvedValue(vehiclesList)
const mockCreate = vi.fn().mockResolvedValue(vehicle1)
const mockUpdate = vi.fn().mockResolvedValue(vehicle1)
const mockRemove = vi.fn().mockResolvedValue(undefined)
const mockImportFile = vi.fn().mockResolvedValue({ imported: 1, errors: [] })
const mockDownloadTemplate = vi.fn().mockResolvedValue(new Blob(['mock']))
const mockExportData = vi.fn().mockResolvedValue(new Blob(['mock']))

vi.mock('@/features/vehicles/api/vehicles.api', () => ({
  vehiclesApi: {
    getAll: () => mockGetAll(),
    create: (d: unknown) => mockCreate(d),
    update: (id: string, d: unknown) => mockUpdate(id, d),
    remove: (id: string) => mockRemove(id),
    importFile: (f: File) => mockImportFile(f),
    downloadTemplate: (fmt: string) => mockDownloadTemplate(fmt),
    exportData: (from: string, to: string, fmt: string) => mockExportData(from, to, fmt),
  },
}))

const { VehiclesPage } = await import('../VehiclesPage')

beforeEach(() => {
  mockGetAll.mockReset().mockResolvedValue(vehiclesList)
  mockCreate.mockReset().mockResolvedValue(vehicle1)
  mockUpdate.mockReset().mockResolvedValue(vehicle1)
  mockRemove.mockReset().mockResolvedValue(undefined)
  mockImportFile.mockReset().mockResolvedValue({ imported: 1, errors: [] })
  mockDownloadTemplate.mockReset().mockResolvedValue(new Blob(['mock']))
  mockExportData.mockReset().mockResolvedValue(new Blob(['mock']))
  vi.mocked(window.confirm).mockReset().mockReturnValue(true)
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })
})

function renderPage() {
  return render(
    <MemoryRouter>
      <Suspense fallback={<div>loading</div>}>
        <VehiclesPage />
      </Suspense>
    </MemoryRouter>,
  )
}

describe('VehiclesPage', () => {
  it('exibe loading enquanto carrega', () => {
    renderPage()
    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('após carregar → exibe lista de veículos', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(vehiclesList[0].plate)).toBeInTheDocument()
      expect(screen.getByText(vehiclesList[1].plate)).toBeInTheDocument()
    })
  })

  it('botão "+ Novo Veículo" abre o formulário', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /novo veículo/i }))
    await user.click(screen.getByRole('button', { name: /novo veículo/i }))
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument()
  })

  it('clique em Excluir com confirm=true → chama remove', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(true)
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getAllByRole('button', { name: /excluir/i }))
    await user.click(screen.getAllByRole('button', { name: /excluir/i })[0])
    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(vehiclesList[0].id))
  })

  it('clique em Excluir com confirm=false → NÃO chama remove', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false)
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getAllByRole('button', { name: /excluir/i }))
    await user.click(screen.getAllByRole('button', { name: /excluir/i })[0])
    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('botão "Baixar Modelo" chama downloadTemplate', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: 'Baixar Modelo' }))
    await user.click(screen.getByRole('button', { name: 'Baixar Modelo' }))
    await waitFor(() => expect(mockDownloadTemplate).toHaveBeenCalled())
  })

  it('botão "Exportar" abre o modal de exportação', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: 'Exportar' }))
    await user.click(screen.getByRole('button', { name: 'Exportar' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('clique em Cancelar no modal fecha o modal', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: 'Exportar' }))
    await user.click(screen.getByRole('button', { name: 'Exportar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('preencher datas e exportar chama exportData', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: 'Exportar' }))
    await user.click(screen.getAllByRole('button', { name: 'Exportar' })[0])
    await user.type(screen.getByLabelText('Data inicial'), '2025-01-01')
    await user.type(screen.getByLabelText('Data final'), '2025-12-31')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Exportar' }))
    await waitFor(() => expect(mockExportData).toHaveBeenCalledWith('2025-01-01', '2025-12-31', 'xlsx'))
  })

  it('selecionar arquivo chama importFile e exibe resultado', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByTestId('import-file-input'))
    const file = new File(['content'], 'veiculos.xlsx')
    await user.upload(screen.getByTestId('import-file-input'), file)
    await waitFor(() => expect(mockImportFile).toHaveBeenCalledWith(file))
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
  })
})
