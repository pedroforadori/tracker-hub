import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CustomerForm } from '../CustomerForm'

function renderForm(props?: Partial<React.ComponentProps<typeof CustomerForm>>) {
  const onSubmit = props?.onSubmit ?? vi.fn().mockResolvedValue(undefined)
  const onCancel = props?.onCancel ?? vi.fn()
  render(<CustomerForm onSubmit={onSubmit} onCancel={onCancel} {...props} />)
  return { onSubmit, onCancel }
}

describe('CustomerForm — modo criação', () => {
  it('exibe todos os campos obrigatórios', () => {
    renderForm()
    expect(screen.getByLabelText(/nome \/ razão social/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cnpj/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mensalidade/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
  })

  it('botão submit é "Cadastrar"', () => {
    renderForm()
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument()
  })
})

describe('CustomerForm — modo edição', () => {
  it('botão submit é "Salvar alterações" quando initialData.id existe', () => {
    renderForm({ initialData: { id: 'cust-1', name: 'Empresa', cnpj: '11222333000181', email: 'a@b.com', phone: '11999999999' } })
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
  })

  it('campos preenchidos com initialData', () => {
    renderForm({ initialData: { id: 'cust-1', name: 'Silva Ltda', cnpj: '11222333000181', email: 'silva@test.com', phone: '11999999999' } })
    expect(screen.getByDisplayValue('Silva Ltda')).toBeInTheDocument()
    expect(screen.getByDisplayValue('silva@test.com')).toBeInTheDocument()
  })
})

describe('CustomerForm — validação', () => {
  it('nome curto → erro "Mínimo 2 caracteres" após blur', async () => {
    const user = userEvent.setup()
    renderForm()
    const nameInput = screen.getByLabelText(/nome \/ razão social/i)
    await user.type(nameInput, 'A')
    await user.tab()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/mínimo 2 caracteres/i))
  })

  it('e-mail inválido → erro após blur', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/e-mail/i), 'nao-e-email')
    await user.tab()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/e-mail inválido/i))
  })

  it('CNPJ inválido → erro de validação', async () => {
    renderForm()
    const cnpjInput = screen.getByLabelText(/cnpj/i)
    fireEvent.change(cnpjInput, { target: { value: '00000000000000' } })
    fireEvent.blur(cnpjInput)
    await waitFor(() => expect(screen.queryByRole('alert')).toBeInTheDocument())
  })

  it('submit com dados inválidos → onSubmit NÃO é chamado', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled())
  })
})

describe('CustomerForm — submit válido', () => {
  it('preencher e submeter → onSubmit chamado', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText(/nome \/ razão social/i), 'Empresa Teste')
    await user.type(screen.getByLabelText(/e-mail/i), 'teste@empresa.com')

    // Simular CNPJ e phone via fireEvent (PatternFormat)
    const cnpjInput = screen.getByLabelText(/cnpj/i)
    fireEvent.change(cnpjInput, { target: { value: '11222333000181' } })

    const phoneInput = screen.getByLabelText(/telefone/i)
    fireEvent.change(phoneInput, { target: { value: '11999999999' } })

    const monthlyFeeInput = screen.getByLabelText(/mensalidade/i)
    fireEvent.change(monthlyFeeInput, { target: { value: '299.90' } })

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
  })

  it('clique em Cancelar chama onCancel', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
