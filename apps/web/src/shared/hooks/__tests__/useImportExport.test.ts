import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useImportExport } from '../useImportExport'
import type { ImportExportApi, ImportResult } from '@/shared/types/api'

function makeApi(overrides?: Partial<ImportExportApi>): ImportExportApi {
  return {
    importFile: vi.fn().mockResolvedValue({ imported: 2, errors: [] } as ImportResult),
    downloadTemplate: vi.fn().mockResolvedValue(new Blob(['mock'])),
    exportData: vi.fn().mockResolvedValue(new Blob(['mock'])),
    ...overrides,
  }
}

describe('useImportExport', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el)
    vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('estado inicial correto', () => {
    const api = makeApi()
    const { result } = renderHook(() => useImportExport(api, 'clientes', vi.fn()))
    expect(result.current.importing).toBe(false)
    expect(result.current.downloadingTemplate).toBe(false)
    expect(result.current.exporting).toBe(false)
    expect(result.current.importResult).toBeNull()
    expect(result.current.importError).toBe('')
    expect(result.current.exportError).toBe('')
  })

  describe('handleImport', () => {
    it('chama importFile e define importResult ao importar com sucesso', async () => {
      const api = makeApi()
      const onSuccess = vi.fn()
      const { result } = renderHook(() => useImportExport(api, 'clientes', onSuccess))
      const file = new File(['content'], 'data.xlsx')

      await act(() => result.current.handleImport(file))

      expect(api.importFile).toHaveBeenCalledWith(file)
      expect(result.current.importResult).toEqual({ imported: 2, errors: [] })
      expect(result.current.importError).toBe('')
    })

    it('chama onImportSuccess quando imported > 0', async () => {
      const onSuccess = vi.fn()
      const { result } = renderHook(() => useImportExport(makeApi(), 'clientes', onSuccess))

      await act(() => result.current.handleImport(new File([''], 'f.xlsx')))

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('NÃO chama onImportSuccess quando imported === 0', async () => {
      const api = makeApi({ importFile: vi.fn().mockResolvedValue({ imported: 0, errors: [{ row: 2, message: 'Erro' }] }) })
      const onSuccess = vi.fn()
      const { result } = renderHook(() => useImportExport(api, 'clientes', onSuccess))

      await act(() => result.current.handleImport(new File([''], 'f.xlsx')))

      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('define importError quando a API lança erro', async () => {
      const api = makeApi({
        importFile: vi.fn().mockRejectedValue({ response: { data: { message: 'Arquivo inválido' } } }),
      })
      const { result } = renderHook(() => useImportExport(api, 'clientes', vi.fn()))

      await act(() => result.current.handleImport(new File([''], 'f.xlsx')))

      expect(result.current.importError).toBe('Arquivo inválido')
      expect(result.current.importResult).toBeNull()
    })

    it('importing é true durante a chamada e false depois', async () => {
      let resolveImport!: () => void
      const api = makeApi({
        importFile: vi.fn().mockImplementation(() => new Promise((res) => {
          resolveImport = () => res({ imported: 1, errors: [] })
        })),
      })
      const { result } = renderHook(() => useImportExport(api, 'clientes', vi.fn()))

      act(() => { void result.current.handleImport(new File([''], 'f.xlsx')) })
      expect(result.current.importing).toBe(true)

      await act(() => { resolveImport() })
      expect(result.current.importing).toBe(false)
    })
  })

  describe('handleTemplateDownload', () => {
    it('chama downloadTemplate com formato padrão xlsx', async () => {
      const api = makeApi()
      const { result } = renderHook(() => useImportExport(api, 'clientes', vi.fn()))

      await act(() => result.current.handleTemplateDownload())

      expect(api.downloadTemplate).toHaveBeenCalledWith('xlsx')
    })

    it('chama downloadTemplate com formato csv quando especificado', async () => {
      const api = makeApi()
      const { result } = renderHook(() => useImportExport(api, 'clientes', vi.fn()))

      await act(() => result.current.handleTemplateDownload('csv'))

      expect(api.downloadTemplate).toHaveBeenCalledWith('csv')
    })

    it('cria link de download e dispara o clique', async () => {
      const api = makeApi()
      const clickSpy = vi.fn()
      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          const el = originalCreateElement('a')
          el.click = clickSpy
          return el
        }
        return originalCreateElement(tag)
      })
      const { result } = renderHook(() => useImportExport(api, 'clientes', vi.fn()))

      await act(() => result.current.handleTemplateDownload())

      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('handleExport', () => {
    it('chama exportData com os parâmetros corretos e retorna true', async () => {
      const api = makeApi()
      const { result } = renderHook(() => useImportExport(api, 'clientes', vi.fn()))

      let success: boolean | undefined
      await act(async () => {
        success = await result.current.handleExport('2025-01-01', '2025-12-31', 'xlsx')
      })

      expect(api.exportData).toHaveBeenCalledWith('2025-01-01', '2025-12-31', 'xlsx')
      expect(success).toBe(true)
    })

    it('define exportError e retorna false quando a API lança erro', async () => {
      const api = makeApi({
        exportData: vi.fn().mockRejectedValue({ response: { data: { message: 'Período inválido' } } }),
      })
      const { result } = renderHook(() => useImportExport(api, 'clientes', vi.fn()))

      let success: boolean | undefined
      await act(async () => {
        success = await result.current.handleExport('2025-01-01', '2025-12-31', 'csv')
      })

      expect(result.current.exportError).toBe('Período inválido')
      expect(success).toBe(false)
    })
  })
})
