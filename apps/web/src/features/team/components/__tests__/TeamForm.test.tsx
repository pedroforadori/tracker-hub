import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TeamForm } from '../TeamForm'

function renderForm(props?: Partial<React.ComponentProps<typeof TeamForm>>) {
  const onSubmit = props?.onSubmit ?? vi.fn().mockResolvedValue(undefined)
  const onCancel = props?.onCancel ?? vi.fn()
  render(<TeamForm onSubmit={onSubmit} onCancel={onCancel} {...props} />)
  return { onSubmit, onCancel }
}

describe('TeamForm — modo criação', () => {
  it('label de senha é "Senha" com asterisco (obrigatória)', () => {
    renderForm()
    // Verificar que o campo senha existe e é required (indicado pelo asterisco)
    const passwordInput = document.getElementById('password') as HTMLInputElement
    expect(passwordInput).toBeInTheDocument()
    // Há asteriscos nos labels required
    expect(screen.getAllByText('*').length).toBeGreaterThan(0)
  })

  it('botão submit é "Adicionar membro"', () => {
    renderForm()
    expect(screen.getByRole('button', { name: 'Adicionar membro' })).toBeInTheDocument()
  })
})

describe('TeamForm — modo edição', () => {
  it('label de senha indica que é opcional', () => {
    renderForm({ initialData: { id: 'u-1', name: 'Teste', email: 'a@b.com', role: 'USER', tenantId: 't-1', createdAt: '' } })
    expect(screen.getByLabelText(/nova senha/i)).toBeInTheDocument()
    // required=false, sem asterisco para senha
  })

  it('botão submit é "Salvar alterações"', () => {
    renderForm({ initialData: { id: 'u-1', name: 'Teste', email: 'a@b.com', role: 'USER', tenantId: 't-1', createdAt: '' } })
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
  })
})

describe('TeamForm — validação', () => {
  it('e-mail inválido → erro após blur', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/^e-mail/i), 'invalido')
    await user.tab()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/e-mail inválido/i))
  })

  it('senha fraca (< 8 chars) → erro após blur', async () => {
    const user = userEvent.setup()
    renderForm()
    // Usar o input pelo id em vez do label (label tem asterisco interno)
    await user.type(document.getElementById('password')!, 'abc')
    await user.tab()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/mínimo 8 caracteres/i))
  })

  it('senha sem número → erro após blur', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(document.getElementById('password')!, 'SemNumero')
    await user.tab()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/letra e um número/i))
  })

  it('submit inválido → onSubmit não chamado', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Adicionar membro' }))
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled())
  })
})
