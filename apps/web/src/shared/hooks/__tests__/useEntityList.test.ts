import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEntityList } from '../useEntityList'

function makeHook() {
  const removeFn = vi.fn().mockResolvedValue(undefined)
  const invalidatePromise = vi.fn()
  const { result } = renderHook(() => useEntityList<{ id: string }>(removeFn, invalidatePromise))
  return { result, removeFn, invalidatePromise }
}

describe('useEntityList', () => {
  it('estado inicial correto', () => {
    const { result } = makeHook()
    expect(result.current.showForm).toBe(false)
    expect(result.current.editing).toBeNull()
    expect(result.current.refresh).toBe(0)
    expect(result.current.deletingIds).toEqual(new Set())
  })

  it('handleEdit() define editing e abre o form', () => {
    const { result } = makeHook()
    const item = { id: 'item-1', name: 'Teste' }

    act(() => result.current.handleEdit(item))

    expect(result.current.showForm).toBe(true)
    expect(result.current.editing).toEqual(item)
  })

  it('handleCancel() fecha o form e limpa editing', () => {
    const { result } = makeHook()
    act(() => result.current.handleEdit({ id: 'x' }))
    act(() => result.current.handleCancel())

    expect(result.current.showForm).toBe(false)
    expect(result.current.editing).toBeNull()
  })

  it('afterSubmit() fecha form, limpa editing, incrementa refresh e chama invalidatePromise', () => {
    const { result, invalidatePromise } = makeHook()
    act(() => result.current.handleEdit({ id: 'x' }))
    act(() => result.current.afterSubmit())

    expect(result.current.showForm).toBe(false)
    expect(result.current.editing).toBeNull()
    expect(result.current.refresh).toBe(1)
    expect(invalidatePromise).toHaveBeenCalledTimes(1)
  })

  it('handleDelete com confirm=true chama removeFn e incrementa refresh', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(true)
    const { result, removeFn } = makeHook()

    await act(() => result.current.handleDelete('item-1'))

    expect(removeFn).toHaveBeenCalledWith('item-1')
    expect(result.current.refresh).toBe(1)
  })

  it('deletingIds está vazio após o delete completar', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(true)
    const { result, removeFn } = makeHook()

    await act(() => result.current.handleDelete('item-1'))

    expect(removeFn).toHaveBeenCalledWith('item-1')
    expect(result.current.deletingIds).toEqual(new Set())
  })

  it('handleDelete com confirm=false NÃO chama removeFn', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false)
    const { result, removeFn } = makeHook()

    await act(() => result.current.handleDelete('item-1'))

    expect(removeFn).not.toHaveBeenCalled()
    expect(result.current.refresh).toBe(0)
  })

  it('handleDelete ignora segunda chamada com mesmo id (guard double-click)', async () => {
    vi.mocked(window.confirm).mockReturnValue(true)
    let resolveFirst!: () => void
    const pendingDelete = new Promise<void>((resolve) => { resolveFirst = resolve })
    const removeFn = vi.fn().mockReturnValueOnce(pendingDelete).mockResolvedValue(undefined)
    const { result } = renderHook(() => useEntityList<{ id: string }>(removeFn, vi.fn()))

    // primeira chamada — fica pendente
    act(() => { result.current.handleDelete('item-1') })
    // segunda chamada com mesmo id enquanto primeira está em voo
    await act(() => result.current.handleDelete('item-1'))

    resolveFirst()
    expect(removeFn).toHaveBeenCalledTimes(1)
  })

  it('handleDelete chama alert e limpa deletingIds em caso de erro da API', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const removeFn = vi.fn().mockRejectedValue(new Error('Forbidden'))
    const { result } = renderHook(() => useEntityList<{ id: string }>(removeFn, vi.fn()))

    await act(() => result.current.handleDelete('item-1'))

    expect(alertSpy).toHaveBeenCalledWith('Forbidden')
    expect(result.current.deletingIds).toEqual(new Set())
    alertSpy.mockRestore()
  })

  it('invalidate() incrementa refresh e chama invalidatePromise', () => {
    const { result, invalidatePromise } = makeHook()
    act(() => result.current.invalidate())

    expect(result.current.refresh).toBe(1)
    expect(invalidatePromise).toHaveBeenCalledTimes(1)
  })
})
