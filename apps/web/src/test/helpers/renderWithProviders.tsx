import { render, type RenderOptions } from '@testing-library/react'
import { type ReactNode, Suspense } from 'react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { ThemeProvider } from '@/components/atoms/ThemeProvider'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps
  withTheme?: boolean
  withSuspense?: boolean
  suspenseFallback?: ReactNode
}

export function renderWithProviders(
  ui: ReactNode,
  {
    routerProps,
    withTheme = true,
    withSuspense = false,
    suspenseFallback = <div>loading</div>,
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    let content = children
    if (withSuspense) content = <Suspense fallback={suspenseFallback}>{content}</Suspense>
    if (withTheme) content = <ThemeProvider>{content}</ThemeProvider>
    return <MemoryRouter {...routerProps}>{content}</MemoryRouter>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export * from '@testing-library/react'
