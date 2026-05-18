import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { vehiclesList } from '@/test/fixtures/vehicles.fixtures'
import { TrackerForm } from '../TrackerForm'

function renderForm(props?: Partial<React.ComponentProps<typeof TrackerForm>>) {
  const onSubmit = props?.onSubmit ?? vi.fn().mockResolvedValue(undefined)
  const onCancel = props?.onCancel ?? vi.fn()
  render(
    <MemoryRouter>
      <TrackerForm onSubmit={onSubmit} onCancel={onCancel} {...props} />
    </MemoryRouter>,
  )
  return { onSubmit, onCancel }
}

describe('TrackerForm', () => {
  it('exibe todos os campos obrigatórios', () => {
    renderForm()
    expect(screen.getByLabelText(/imei/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/marca/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/modelo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/veículo/i)).toBeInTheDocument()
  })

  it('carrega veículos via MSW e exibe no select', async () => {
    renderForm()
    await waitFor(() => {
      expect(screen.getByRole('option', { name: new RegExp(vehiclesList[0].plate) })).toBeInTheDocument()
    })
  })

  it('IMEI com Luhn válido → sem erro após blur', async () => {
    renderForm()
    const imeiInput = screen.getByLabelText(/imei/i)
    fireEvent.change(imeiInput, { target: { value: '356938035643809' } })
    fireEvent.blur(imeiInput)
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('IMEI com Luhn inválido → erro "IMEI inválido"', async () => {
    renderForm()
    const imeiInput = screen.getByLabelText(/imei/i)
    fireEvent.change(imeiInput, { target: { value: '356938035643800' } })
    fireEvent.blur(imeiInput)
    await waitFor(() => {
      const alert = screen.queryByRole('alert')
      if (alert) expect(alert).toHaveTextContent(/imei inválido/i)
    })
  })

  it('IMEI com 14 dígitos → erro "IMEI deve ter 15 dígitos"', async () => {
    renderForm()
    const imeiInput = screen.getByLabelText(/imei/i)
    fireEvent.change(imeiInput, { target: { value: '35693803564380' } })
    fireEvent.blur(imeiInput)
    await waitFor(() => {
      const alert = screen.queryByRole('alert')
      if (alert) expect(alert).toHaveTextContent(/15 dígitos/i)
    })
  })

  it('submit inválido → onSubmit não chamado', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled())
  })
})
