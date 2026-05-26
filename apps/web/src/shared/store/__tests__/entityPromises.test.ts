import { beforeEach, describe, expect, it, vi } from 'vitest'
import { customer1, customer2, customersList } from '@/test/fixtures/customers.fixtures'

// Mock das APIs antes de importar o módulo testado, para que os módulos de nível
// de módulo não façam requests reais durante os testes.
const mockCustomersGetAll = vi.fn().mockResolvedValue(customersList)
const mockVehiclesGetAll = vi.fn().mockResolvedValue([])

vi.mock('@/features/customers/api/customers.api', () => ({
  customersApi: { getAll: () => mockCustomersGetAll() },
}))
vi.mock('@/features/vehicles/api/vehicles.api', () => ({
  vehiclesApi: { getAll: () => mockVehiclesGetAll() },
}))

const {
  getCustomersPromise,
  getVehiclesPromise,
  invalidateCustomers,
  invalidateVehicles,
  patchCustomerStatus,
  clearAllCaches,
} = await import('../entityPromises')

// Reinicia o cache e os contadores de chamadas entre testes para garantir isolamento.
beforeEach(() => {
  clearAllCaches()
  mockCustomersGetAll.mockClear()
  mockCustomersGetAll.mockResolvedValue(customersList)
  mockVehiclesGetAll.mockClear()
  mockVehiclesGetAll.mockResolvedValue([])
})

// ─── getCustomersPromise ──────────────────────────────────────────────────────

describe('getCustomersPromise', () => {
  it('retorna sempre a mesma referência enquanto não for invalidado', () => {
    const p1 = getCustomersPromise()
    const p2 = getCustomersPromise()
    expect(p1).toBe(p2)
  })

  it('a promise resolvida carrega o status fulfilled e o value correto', async () => {
    const p = getCustomersPromise()
    const result = await p
    expect(p.status).toBe('fulfilled')
    expect(p.value).toEqual(customersList)
    expect(result).toEqual(customersList)
  })

  it('inicia com status pending', () => {
    const p = getCustomersPromise()
    // O status muda de forma assíncrona; logo após a criação deve ser pending.
    expect(p.status).toBe('pending')
  })
})

// ─── invalidateCustomers ─────────────────────────────────────────────────────

describe('invalidateCustomers', () => {
  it('substitui a promise por uma nova referência', () => {
    const p1 = getCustomersPromise()
    invalidateCustomers()
    const p2 = getCustomersPromise()
    expect(p1).not.toBe(p2)
  })

  it('nova promise também carrega os dados corretamente', async () => {
    const newList = [customer1]
    mockCustomersGetAll.mockResolvedValueOnce(newList)
    invalidateCustomers()
    const result = await getCustomersPromise()
    expect(result).toEqual(newList)
  })
})

// ─── patchCustomerStatus ─────────────────────────────────────────────────────

describe('patchCustomerStatus', () => {
  it('patcha o status de um cliente no cache sem refetch', async () => {
    await getCustomersPromise() // aguarda resolução
    patchCustomerStatus(customer1.id, 'INATIVO')
    const result = await getCustomersPromise()
    expect(result.find((c) => c.id === customer1.id)?.status).toBe('INATIVO')
    expect(mockCustomersGetAll).toHaveBeenCalledTimes(1) // nenhum refetch extra
  })

  it('não altera outros clientes ao patchar um', async () => {
    await getCustomersPromise()
    patchCustomerStatus(customer1.id, 'INATIVO')
    const result = await getCustomersPromise()
    expect(result.find((c) => c.id === customer2.id)?.status).toBe(customer2.status)
  })

  it('cria thenable com status fulfilled imediatamente após o patch', async () => {
    await getCustomersPromise()
    patchCustomerStatus(customer1.id, 'INATIVO')
    const p = getCustomersPromise()
    expect(p.status).toBe('fulfilled')
    expect(p.value?.find((c) => c.id === customer1.id)?.status).toBe('INATIVO')
  })

  it('é no-op se o cache ainda estiver pending (null ou não resolvido)', () => {
    // cache é null após clearAllCaches() no beforeEach
    expect(() => patchCustomerStatus(customer1.id, 'INATIVO')).not.toThrow()
    // uma nova promise é criada ao chamar getCustomersPromise() — não patchada
    const p = getCustomersPromise()
    expect(p.status).toBe('pending')
  })
})

// ─── clearAllCaches ───────────────────────────────────────────────────────────

describe('clearAllCaches', () => {
  it('força nova busca após limpar clientes', () => {
    const p1 = getCustomersPromise()
    clearAllCaches()
    const p2 = getCustomersPromise()
    expect(p1).not.toBe(p2)
    expect(mockCustomersGetAll).toHaveBeenCalledTimes(2)
  })

  it('força nova busca após limpar veículos', () => {
    const p1 = getVehiclesPromise()
    clearAllCaches()
    const p2 = getVehiclesPromise()
    expect(p1).not.toBe(p2)
  })

  it('limpa ambos os caches simultaneamente', () => {
    getCustomersPromise()
    getVehiclesPromise()
    clearAllCaches()
    // Após clear, ambas geram novas promises (novas chamadas à API)
    getCustomersPromise()
    getVehiclesPromise()
    expect(mockCustomersGetAll).toHaveBeenCalledTimes(2)
    expect(mockVehiclesGetAll).toHaveBeenCalledTimes(2)
  })
})
