import { describe, expect, it } from 'vitest'
import { useAuthStore } from '../authStore'
import { adminUser } from '@/test/fixtures/auth.fixtures'

describe('authStore', () => {
  it('tem estado inicial correto', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('login() define token, user e isAuthenticated', () => {
    const { login } = useAuthStore.getState()
    login('fake-token-123', adminUser)

    const state = useAuthStore.getState()
    expect(state.token).toBe('fake-token-123')
    expect(state.user).toEqual(adminUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('logout() reseta todos os campos para o estado inicial', () => {
    const { login, logout } = useAuthStore.getState()
    login('fake-token-123', adminUser)
    logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('persist escreve no localStorage com a chave correta', () => {
    const { login } = useAuthStore.getState()
    login('persisted-token', adminUser)

    const stored = localStorage.getItem('tracker-hub-auth')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.token).toBe('persisted-token')
    expect(parsed.state.isAuthenticated).toBe(true)
  })

  it('updateUser() mescla campos parciais no user existente', () => {
    const { login, updateUser } = useAuthStore.getState()
    login('fake-token-123', adminUser)
    updateUser({ name: 'Novo Nome' })
    const state = useAuthStore.getState()
    expect(state.user?.name).toBe('Novo Nome')
    expect(state.user?.email).toBe(adminUser.email)
    expect(state.user?.role).toBe(adminUser.role)
  })

  it('updateUser() não altera user quando não autenticado', () => {
    const { updateUser } = useAuthStore.getState()
    updateUser({ name: 'Qualquer Nome' })
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('não vaza estado entre testes (resetAllStores chamado no afterEach)', () => {
    // Este teste verifica que o reset do setup.ts funciona
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
  })
})
