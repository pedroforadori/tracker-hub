import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { resetAllStores } from './helpers/storeHelpers'
import { server } from './msw/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

afterEach(() => {
  server.resetHandlers()
  cleanup()
  resetAllStores()
  localStorage.clear()
})

afterAll(() => server.close())

// jsdom não implementa window.confirm — stub global para evitar travamento
vi.stubGlobal('confirm', vi.fn(() => true))

// jsdom não implementa window.matchMedia (usado pelo ThemeProvider)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
