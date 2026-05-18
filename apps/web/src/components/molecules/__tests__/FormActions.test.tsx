import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormActions } from '../FormActions'

describe('FormActions', () => {
  it('label padrão do submit é "Cadastrar" quando isEditing=false', () => {
    render(<FormActions onCancel={vi.fn()} isEditing={false} />)
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument()
  })

  it('label do submit é "Salvar alterações" quando isEditing=true', () => {
    render(<FormActions onCancel={vi.fn()} isEditing={true} />)
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
  })

  it('submitLabel personalizado sobrescreve o padrão', () => {
    render(<FormActions onCancel={vi.fn()} submitLabel="Confirmar" />)
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })

  it('isSubmitting=true → label "Salvando..." e botão submit disabled', () => {
    render(<FormActions onCancel={vi.fn()} isSubmitting />)
    const submitBtn = screen.getByRole('button', { name: 'Salvando...' })
    expect(submitBtn).toBeDisabled()
  })

  it('isSubmitting=false → botão submit habilitado', () => {
    render(<FormActions onCancel={vi.fn()} isSubmitting={false} />)
    expect(screen.getByRole('button', { name: 'Cadastrar' })).not.toBeDisabled()
  })

  it('clique em Cancelar chama onCancel()', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<FormActions onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('botão Cancelar é do tipo "button" (não submit)', () => {
    render(<FormActions onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute('type', 'button')
  })

  it('botão submit é do tipo "submit"', () => {
    render(<FormActions onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toHaveAttribute('type', 'submit')
  })
})
