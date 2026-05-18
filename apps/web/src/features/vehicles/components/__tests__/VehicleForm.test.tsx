import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { customersList } from '@/test/fixtures/customers.fixtures'
import { VehicleForm } from '../VehicleForm'

function renderForm(props?: Partial<React.ComponentProps<typeof VehicleForm>>) {
  const onSubmit = props?.onSubmit ?? vi.fn().mockResolvedValue(undefined)
  const onCancel = props?.onCancel ?? vi.fn()
  render(
    <MemoryRouter>
      <VehicleForm onSubmit={onSubmit} onCancel={onCancel} {...props} />
    </MemoryRouter>,
  )
  return { onSubmit, onCancel }
}

describe('VehicleForm', () => {
  it('exibe todos os campos obrigatórios', () => {
    renderForm()
    expect(screen.getByLabelText(/placa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/marca/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/modelo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ano/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cliente/i)).toBeInTheDocument()
  })

  it('carrega clientes via MSW e exibe no select', async () => {
    renderForm()
    await waitFor(() => {
      expect(screen.getByRole('option', { name: customersList[0].name })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: customersList[1].name })).toBeInTheDocument()
    })
  })

  it('select de cliente vazio → opção padrão "Selecione um cliente"', () => {
    renderForm()
    expect(screen.getByRole('option', { name: /selecione um cliente/i })).toBeInTheDocument()
  })

  it('ano inválido < 1990 → erro', async () => {
    renderForm()
    const yearInput = screen.getByLabelText(/ano/i)
    fireEvent.change(yearInput, { target: { value: '1989' } })
    fireEvent.blur(yearInput)
    await waitFor(() => expect(screen.queryByRole('alert')).toBeInTheDocument())
  })

  it('botão "Cadastrar" no modo criação', () => {
    renderForm()
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument()
  })

  it('modo edição → botão "Salvar alterações"', () => {
    renderForm({ initialData: { id: 'veh-1', plate: 'ABC1D23', brand: 'Toyota', model: 'Hilux', year: 2022, customerId: 'cust-1' } })
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
  })

  it('clique em Cancelar chama onCancel', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
