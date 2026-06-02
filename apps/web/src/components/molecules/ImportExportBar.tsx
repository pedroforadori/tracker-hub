import { Download, FileDown, Upload } from 'lucide-react'

interface ImportExportBarProps {
  onImport: (file: File) => void
  onTemplateDownload: () => void
  onExportOpen: () => void
  importing: boolean
  downloadingTemplate: boolean
}

export function ImportExportBar({
  onImport,
  onTemplateDownload,
  onExportOpen,
  importing,
  downloadingTemplate,
}: ImportExportBarProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
      e.target.value = ''
    }
  }

  const btnBase = 'inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent'

  return (
    <div className="flex items-center gap-2">
      <label className={`${btnBase} cursor-pointer ${importing ? 'cursor-not-allowed opacity-50' : ''}`}>
        {importing ? (
          <>
            <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Importando...
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Importar
          </>
        )}
        <input
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={handleFileChange}
          disabled={importing}
          data-testid="import-file-input"
        />
      </label>

      <button
        type="button"
        onClick={() => onTemplateDownload()}
        disabled={downloadingTemplate}
        className={`${btnBase} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {downloadingTemplate ? (
          <>
            <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Baixando...
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Baixar Modelo
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onExportOpen}
        className={btnBase}
      >
        <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
        Exportar
      </button>
    </div>
  )
}
