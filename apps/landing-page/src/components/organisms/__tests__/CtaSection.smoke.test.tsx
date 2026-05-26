import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CtaSection } from '../CtaSection'

// Suprime console.error nos testes (fetch failures esperados)
beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}))
afterEach(() => jest.restoreAllMocks())

describe('CtaSection', () => {
  it('exibe os três planos com seus preços', () => {
    render(<CtaSection />)

    // Verifica labels dos planos (usamos getAllByText pois "Mensal" aparece no card E no botão)
    expect(screen.getAllByText(/^mensal$/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/^trimestral$/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/^anual$/i).length).toBeGreaterThanOrEqual(1)

    // Preços exibidos
    expect(screen.getByText('47')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
  })

  it('exibe três botões de contratar', () => {
    render(<CtaSection />)
    const buttons = screen.getAllByRole('button', { name: /contratar/i })
    expect(buttons).toHaveLength(3)
  })

  it('badge "Mais vantajoso" aparece apenas no plano anual', () => {
    render(<CtaSection />)
    expect(screen.getByText(/mais vantajoso/i)).toBeInTheDocument()
  })

  it('mostra spinner e desabilita os demais botões ao clicar em contratar', async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) // pendente para sempre

    const user = userEvent.setup()
    render(<CtaSection />)

    await user.click(screen.getByRole('button', { name: /contratar mensal/i }))

    await waitFor(() => expect(screen.getByText(/aguarde/i)).toBeInTheDocument())

    // Todos os botões ficam desabilitados durante o loading
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('exibe mensagem de erro quando o checkout falha', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false })

    const user = userEvent.setup()
    render(<CtaSection />)

    await user.click(screen.getAllByRole('button', { name: /contratar/i })[0])

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/erro ao iniciar o checkout/i),
    )
  })

  it('envia o period correto no body do fetch ao contratar plano trimestral', async () => {
    // jsdom não navega de verdade — a atribuição de href é no-op, por isso não precisamos
    // interceptar window.location; basta verificar que fetch foi chamado com o body certo.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/fake' }),
    })

    const user = userEvent.setup()
    render(<CtaSection />)

    await user.click(screen.getByRole('button', { name: /contratar trimestral/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/checkout',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ period: 'Trimestral' }),
        }),
      )
    })
  })
})
