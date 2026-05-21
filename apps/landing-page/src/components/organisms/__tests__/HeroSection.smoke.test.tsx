import { render, screen } from '@testing-library/react'
import { HeroSection } from '../HeroSection'

describe('HeroSection', () => {
  it('exibe o heading principal', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('exibe os links de call-to-action', () => {
    render(<HeroSection />)
    expect(screen.getByRole('link', { name: /contratar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /demo/i })).toBeInTheDocument()
  })
})
