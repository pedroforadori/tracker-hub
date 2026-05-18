import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { trackersList } from '@/test/fixtures/trackers.fixtures'
import { ChipForm } from '../ChipForm'

function renderForm(props?: Partial<React.ComponentProps<typeof ChipForm>>) {
  const onSubmit = props?.onSubmit ?? vi.fn().mockResolvedValue(undefined)
  const onCancel = props?.onCancel ?? vi.fn()
  render(
    <MemoryRouter>
      <ChipForm onSubmit={onSubmit} onCancel={onCancel} {...props} />
    </MemoryRouter>,
  )
  return { onSubmit, onCancel }
}

describe('ChipForm', () => {
  it('exibe todos os campos obrigatórios', () => {
    renderForm()
    expect(screen.getByLabelText(/iccid/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/número de telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/operadora/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rastreador/i)).toBeInTheDocument()
  })

  it('carrega rastreadores via MSW e exibe no select', async () => {
    renderForm()
    await waitFor(() => {
      expect(screen.getByRole('option', { name: new RegExp(trackersList[0].imei) })).toBeInTheDocument()
    })
  })

  it('ICCID com menos de 18 chars → erro após blur', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/iccid/i), '12345')
    await user.tab()
    await waitFor(() => expect(screen.queryByRole('alert')).toHaveTextContent(/iccid inválido/i))
  })

  it('número de telefone com menos de 10 chars → erro após blur', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/número de telefone/i), '12345')
    await user.tab()
    await waitFor(() => expect(screen.queryByRole('alert')).toHaveTextContent(/número inválido/i))
  })

  it('clique em Cancelar chama onCancel', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
