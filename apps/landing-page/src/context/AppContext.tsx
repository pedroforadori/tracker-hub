'use client'

import { createContext, useCallback, useContext, useState } from 'react'

interface AppContextValue {
  isMenuOpen: boolean
  toggleMenu: () => void
  closeMenu: () => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleMenu = useCallback(() => setIsMenuOpen((v) => !v), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  return (
    <AppContext.Provider value={{ isMenuOpen, toggleMenu, closeMenu }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext deve ser usado dentro de AppProvider')
  return ctx
}
