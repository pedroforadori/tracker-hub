import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImportExportBar } from '../ImportExportBar'

function renderBar(overrides?: Partial<React.ComponentProps<typeof ImportExportBar>>) {
  const onImport = overrides?.onImport ?? vi.fn()
  const onTemplateDownload = overrides?.onTemplateDownload ?? vi.fn()
  const onExportOpen = overrides?.onExportOpen ?? vi.fn()
  render(
    <ImportExportBar
      onImport={onImport}
      onTemplateDownload={onTemplateDownload}
      onExportOpen={onExportOpen}
      importing={overrides?.importing ?? false}
      downloadingTemplate={overrides?.downloadingTemplate ?? false}
    />,
  )
  return { onImport, onTemplateDownload, onExportOpen }
}

describe('ImportExportBar', () => {
  it('renderiza os 3 botões de ação', () => {
    renderBar()
    expect(screen.getByText('Importar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Baixar Modelo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument()
  })

  it('input de arquivo aceita apenas .csv e .xlsx', () => {
    renderBar()
    const input = screen.getByTestId('import-file-input')
    expect(input).toHaveAttribute('accept', '.csv,.xlsx')
  })

  it('clique em "Baixar Modelo" chama onTemplateDownload', async () => {
    const user = userEvent.setup()
    const { onTemplateDownload } = renderBar()
    await user.click(screen.getByRole('button', { name: 'Baixar Modelo' }))
    expect(onTemplateDownload).toHaveBeenCalledTimes(1)
  })

  it('clique em "Exportar" chama onExportOpen', async () => {
    const user = userEvent.setup()
    const { onExportOpen } = renderBar()
    await user.click(screen.getByRole('button', { name: 'Exportar' }))
    expect(onExportOpen).toHaveBeenCalledTimes(1)
  })

  it('importing=true exibe "Importando..." e desabilita o input', () => {
    renderBar({ importing: true })
    expect(screen.getByText('Importando...')).toBeInTheDocument()
    expect(screen.getByTestId('import-file-input')).toBeDisabled()
  })

  it('downloadingTemplate=true exibe "Baixando..." e desabilita o botão', () => {
    renderBar({ downloadingTemplate: true })
    expect(screen.getByRole('button', { name: 'Baixando...' })).toBeDisabled()
  })

  it('selecionar arquivo chama onImport com o File selecionado', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn()
    renderBar({ onImport })
    const file = new File(['content'], 'planilha.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const input = screen.getByTestId('import-file-input')
    await user.upload(input, file)
    expect(onImport).toHaveBeenCalledWith(file)
  })
})
