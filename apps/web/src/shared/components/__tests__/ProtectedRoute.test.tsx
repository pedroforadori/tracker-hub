import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { authenticateAsAdmin, authenticateAsUser } from '@/test/helpers/storeHelpers'
import { ProtectedRoute } from '../ProtectedRoute'

function renderRoutes(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<span>página de login</span>} />
        <Route path="/" element={<span>home</span>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protegida" element={<span>rota protegida</span>} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin-only" element={<span>admin only</span>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('não autenticado → redireciona para /login', () => {
    renderRoutes('/protegida')
    expect(screen.getByText('página de login')).toBeInTheDocument()
  })

  it('autenticado sem allowedRoles → renderiza o Outlet', () => {
    authenticateAsAdmin()
    renderRoutes('/protegida')
    expect(screen.getByText('rota protegida')).toBeInTheDocument()
  })

  it('ADMIN com allowedRoles=["ADMIN"] → renderiza o Outlet', () => {
    authenticateAsAdmin()
    renderRoutes('/admin-only')
    expect(screen.getByText('admin only')).toBeInTheDocument()
  })

  it('USER com allowedRoles=["ADMIN"] → redireciona para /', () => {
    authenticateAsUser()
    renderRoutes('/admin-only')
    expect(screen.getByText('home')).toBeInTheDocument()
  })

  it('USER sem allowedRoles → renderiza o Outlet', () => {
    authenticateAsUser()
    renderRoutes('/protegida')
    expect(screen.getByText('rota protegida')).toBeInTheDocument()
  })
})
