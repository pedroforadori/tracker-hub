import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '../ThemeProvider'
import { ThemeToggle } from '../ThemeToggle'

function renderToggle(initialTheme: 'light' | 'dark' = 'light') {
  if (initialTheme === 'dark') localStorage.setItem('theme', 'dark')
  return render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
}

describe('ThemeToggle', () => {
  it('exibe ícone Moon quando tema é light', () => {
    renderToggle('light')
    // Moon não está visível em dark; o aria-label muda para escuro
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Mudar para modo escuro')
  })

  it('exibe ícone Sun quando tema é dark', () => {
    renderToggle('dark')
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Mudar para modo claro')
  })

  it('clique chama toggleTheme e muda o aria-label', async () => {
    const user = userEvent.setup()
    renderToggle('light')
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Mudar para modo claro')
  })
})
