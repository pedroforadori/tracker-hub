import { useState } from 'react'

interface ExportModalProps {
  onClose: () => void
  onExport: (from: string, to: string, format: 'xlsx' | 'csv') => void
  exporting: boolean
  exportError: string
}

export function ExportModal({ onClose, onExport, exporting, exportError }: ExportModalProps) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx')

  const canSubmit = Boolean(from && to) && !exporting

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onExport(from, to, format)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-2xl">
        <h2 id="export-modal-title" className="mb-4 text-base font-medium">
          Exportar dados
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="export-from" className="mb-1 block text-sm font-medium">
              Data inicial
            </label>
            <input
              id="export-from"
              type="date"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="export-to" className="mb-1 block text-sm font-medium">
              Data final
            </label>
            <input
              id="export-to"
              type="date"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="export-format" className="mb-1 block text-sm font-medium">
              Formato
            </label>
            <select
              id="export-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as 'xlsx' | 'csv')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="xlsx">XLSX</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          {exportError && (
            <p role="alert" className="text-sm text-destructive">
              {exportError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Exportando...
                </>
              ) : (
                'Exportar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
