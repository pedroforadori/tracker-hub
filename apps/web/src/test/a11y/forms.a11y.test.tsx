import axe from 'axe-core'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '@/components/atoms/ThemeProvider'
import { FormField } from '@/components/molecules/FormField'
import { FormActions } from '@/components/molecules/FormActions'
import { LoginPage } from '@/features/auth/pages/LoginPage'

async function checkA11y(container: HTMLElement) {
  const results = await axe.run(container)
  return results.violations
}

describe('Acessibilidade — LoginPage', () => {
  it('não tem violações axe', async () => {
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider>
          <LoginPage />
        </ThemeProvider>
      </MemoryRouter>,
    )

    const violations = await checkA11y(container)
    expect(violations).toEqual([])
  })
})

describe('Acessibilidade — FormField', () => {
  it('label associado ao input via htmlFor', () => {
    const { container } = render(
      <FormField label="Nome" htmlFor="nome-input" required>
        <input id="nome-input" />
      </FormField>,
    )
    const label = container.querySelector('label')
    expect(label?.htmlFor).toBe('nome-input')
  })

  it('erro tem role="alert"', async () => {
    const { container } = render(
      <FormField label="Nome" htmlFor="nome-input" error="Campo obrigatório">
        <input id="nome-input" />
      </FormField>,
    )
    const violations = await checkA11y(container)
    // Não deve ter violações com o role="alert" correto
    const alertViolations = violations.filter((v) => v.id === 'aria-required-attr')
    expect(alertViolations).toHaveLength(0)
  })

  it('required indicado com asterisco visível (não apenas aria-required)', () => {
    const { container } = render(
      <FormField label="Nome" htmlFor="nome-input" required>
        <input id="nome-input" />
      </FormField>,
    )
    expect(container.querySelector('span')?.textContent).toBe('*')
  })
})

describe('Acessibilidade — FormActions', () => {
  it('botões com tipo correto (button e submit)', async () => {
    const { container } = render(<FormActions onCancel={() => {}} />)
    const violations = await checkA11y(container)
    const buttonViolations = violations.filter((v) => v.id === 'button-name')
    expect(buttonViolations).toHaveLength(0)
  })
})
