import { useState } from 'react'
import type { ImportExportApi, ImportResult } from '@/shared/types/api'

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function useImportExport(
  entityApi: ImportExportApi,
  defaultFilename: string,
  onImportSuccess: () => void,
) {
  const [importing, setImporting] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const [exportError, setExportError] = useState('')
  const [templateError, setTemplateError] = useState('')

  const handleImport = async (file: File) => {
    setImporting(true)
    setImportError('')
    setImportResult(null)
    try {
      const result = await entityApi.importFile(file)
      setImportResult(result)
      if (result.imported > 0) onImportSuccess()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao importar arquivo'
      setImportError(msg)
    } finally {
      setImporting(false)
    }
  }

  const handleTemplateDownload = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    setDownloadingTemplate(true)
    setTemplateError('')
    try {
      const blob = await entityApi.downloadTemplate(format)
      triggerDownload(blob, `modelo-${defaultFilename}.${format}`)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao baixar modelo'
      setTemplateError(msg)
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleExport = async (from: string, to: string, format: 'xlsx' | 'csv'): Promise<boolean> => {
    setExporting(true)
    setExportError('')
    try {
      const blob = await entityApi.exportData(from, to, format)
      triggerDownload(blob, `${defaultFilename}-${from}-${to}.${format}`)
      return true
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao exportar'
      setExportError(msg)
      return false
    } finally {
      setExporting(false)
    }
  }

  return {
    importing,
    downloadingTemplate,
    exporting,
    importResult,
    importError,
    templateError,
    exportError,
    handleImport,
    handleTemplateDownload,
    handleExport,
  }
}
