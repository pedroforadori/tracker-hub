import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ImportResultAlert } from '../ImportResultAlert'

describe('ImportResultAlert', () => {
  it('retorna null quando result é null e error está vazio', () => {
    const { container } = render(<ImportResultAlert result={null} error="" />)
    expect(container.firstChild).toBeNull()
  })

  it('exibe mensagem de erro com role=alert quando error não está vazio', () => {
    render(<ImportResultAlert result={null} error="Arquivo inválido" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Arquivo inválido')
  })

  it('exibe contagem de importados e sem erros quando errors está vazio', () => {
    render(<ImportResultAlert result={{ imported: 3, errors: [] }} error="" />)
    expect(screen.getByRole('status')).toHaveTextContent('3 registro(s) importado(s) com sucesso.')
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('exibe lista de erros por linha quando errors não está vazio', () => {
    render(
      <ImportResultAlert
        result={{
          imported: 1,
          errors: [
            { row: 2, message: 'CNPJ inválido' },
            { row: 4, message: 'E-mail inválido' },
          ],
        }}
        error=""
      />,
    )
    expect(screen.getByText('Linha 2: CNPJ inválido')).toBeInTheDocument()
    expect(screen.getByText('Linha 4: E-mail inválido')).toBeInTheDocument()
  })

  it('error tem prioridade sobre result', () => {
    render(<ImportResultAlert result={{ imported: 2, errors: [] }} error="Erro fatal" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Erro fatal')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
