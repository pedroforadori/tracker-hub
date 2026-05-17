import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormEntity } from '../FormEntity'

describe('FormEntity', () => {
  it('exibe os campos do formulário em modo criação', () => {
    render(<FormEntity />)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/placa/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar/i })).toBeInTheDocument()
  })

  it('exibe mensagem de bloqueio quando isEditable é false', () => {
    render(<FormEntity isEditable={false} />)
    expect(screen.getByRole('status')).toHaveTextContent(/bloqueado/i)
    expect(screen.getByRole('button', { name: /criar/i })).toBeDisabled()
  })

  it('exibe título de edição quando initialData é fornecido', () => {
    render(<FormEntity initialData={{ name: 'João', email: 'joao@teste.com' }} />)
    expect(screen.getByRole('heading', { name: /editar/i })).toBeInTheDocument()
  })
})
