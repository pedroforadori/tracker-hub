import { render, screen, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThemeProvider, useTheme } from '../ThemeProvider'

function ThemeConsumer() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  it('tema padrão é light quando localStorage está vazio', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('tema inicial é dark quando localStorage tem theme=dark', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('toggleTheme() muda de light para dark e adiciona classe dark no <html>', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    act(() => screen.getByRole('button').click())
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme() muda de dark para light e remove classe dark do <html>', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    act(() => screen.getByRole('button').click())
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persiste o tema no localStorage após toggle', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    act(() => screen.getByRole('button').click())
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('useTheme() fora do ThemeProvider lança erro', () => {
    function BadComponent() {
      useTheme()
      return null
    }
    expect(() => render(<BadComponent />)).toThrow('useTheme deve ser usado dentro de ThemeProvider')
  })
})
