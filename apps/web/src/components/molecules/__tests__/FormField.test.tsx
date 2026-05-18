import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from '../FormField'

describe('FormField', () => {
  it('renderiza label com o texto correto', () => {
    render(<FormField label="Nome" htmlFor="name"><input id="name" /></FormField>)
    expect(screen.getByText('Nome')).toBeInTheDocument()
  })

  it('associa o label ao input via htmlFor', () => {
    render(<FormField label="E-mail" htmlFor="email"><input id="email" /></FormField>)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  it('renderiza children', () => {
    render(<FormField label="Nome" htmlFor="name"><input id="name" placeholder="Digite aqui" /></FormField>)
    expect(screen.getByPlaceholderText('Digite aqui')).toBeInTheDocument()
  })

  it('sem error → sem role="alert"', () => {
    render(<FormField label="Nome" htmlFor="name"><input id="name" /></FormField>)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('com error → exibe role="alert" com a mensagem', () => {
    render(<FormField label="Nome" htmlFor="name" error="Campo obrigatório"><input id="name" /></FormField>)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('Campo obrigatório')
  })

  it('com required → exibe asterisco visível', () => {
    render(<FormField label="Nome" htmlFor="name" required><input id="name" /></FormField>)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('sem required → sem asterisco', () => {
    render(<FormField label="Nome" htmlFor="name"><input id="name" /></FormField>)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })
})
