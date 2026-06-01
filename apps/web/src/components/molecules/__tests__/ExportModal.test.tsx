import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExportModal } from '../ExportModal'

function renderModal(overrides?: Partial<React.ComponentProps<typeof ExportModal>>) {
  const onClose = overrides?.onClose ?? vi.fn()
  const onExport = overrides?.onExport ?? vi.fn()
  render(
    <ExportModal
      onClose={onClose}
      onExport={onExport}
      exporting={overrides?.exporting ?? false}
      exportError={overrides?.exportError ?? ''}
    />,
  )
  return { onClose, onExport }
}

describe('ExportModal', () => {
  it('renderiza campos de data e seletor de formato', () => {
    renderModal()
    expect(screen.getByLabelText('Data inicial')).toBeInTheDocument()
    expect(screen.getByLabelText('Data final')).toBeInTheDocument()
    expect(screen.getByLabelText('Formato')).toBeInTheDocument()
  })

  it('botão "Exportar" fica desabilitado quando datas estão vazias', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeDisabled()
  })

  it('botão "Exportar" fica habilitado após preencher ambas as datas', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText('Data inicial'), '2025-01-01')
    await user.type(screen.getByLabelText('Data final'), '2025-12-31')
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeEnabled()
  })

  it('submeter o formulário com datas preenchidas chama onExport com args corretos', async () => {
    const user = userEvent.setup()
    const { onExport } = renderModal()
    await user.type(screen.getByLabelText('Data inicial'), '2025-01-01')
    await user.type(screen.getByLabelText('Data final'), '2025-12-31')
    await user.click(screen.getByRole('button', { name: 'Exportar' }))
    expect(onExport).toHaveBeenCalledWith('2025-01-01', '2025-12-31', 'xlsx')
  })

  it('alterar formato para CSV e exportar chama onExport com csv', async () => {
    const user = userEvent.setup()
    const { onExport } = renderModal()
    await user.type(screen.getByLabelText('Data inicial'), '2025-01-01')
    await user.type(screen.getByLabelText('Data final'), '2025-12-31')
    await user.selectOptions(screen.getByLabelText('Formato'), 'CSV')
    await user.click(screen.getByRole('button', { name: 'Exportar' }))
    expect(onExport).toHaveBeenCalledWith('2025-01-01', '2025-12-31', 'csv')
  })

  it('exporting=true exibe "Exportando..." e desabilita o botão', () => {
    renderModal({ exporting: true, exportError: '' })
    expect(screen.getByRole('button', { name: /exportando/i })).toBeDisabled()
  })

  it('exportError não vazio é exibido como alerta', () => {
    renderModal({ exportError: 'Erro ao exportar' })
    expect(screen.getByRole('alert')).toHaveTextContent('Erro ao exportar')
  })

  it('clique em "Cancelar" chama onClose', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('tem role=dialog e aria-modal=true', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })
})
