import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRelatedEntities } from '../useRelatedEntities'

describe('useRelatedEntities', () => {
  it('retorna array vazio antes do fetch completar', () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: '1' }])
    const { result } = renderHook(() => useRelatedEntities(fetcher))
    expect(result.current).toEqual([])
  })

  it('popula o array após o fetch', async () => {
    const items = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
    const fetcher = vi.fn().mockResolvedValue(items)
    const { result } = renderHook(() => useRelatedEntities(fetcher))

    await waitFor(() => expect(result.current).toEqual(items))
  })

  it('chama fetcher apenas 1 vez no mount, mesmo com re-renders', async () => {
    const fetcher = vi.fn().mockResolvedValue([])
    const { rerender } = renderHook(() => useRelatedEntities(fetcher))

    rerender()
    rerender()
    rerender()

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  })

  it('não quebra quando fetcher rejeita — array permanece vazio', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useRelatedEntities(fetcher))

    await waitFor(() => expect(fetcher).toHaveBeenCalled())
    expect(result.current).toEqual([])

    errorSpy.mockRestore()
  })
})
