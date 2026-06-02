import { use, useState } from 'react'
import { Plus } from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner'
import { ExportModal } from '@/components/molecules/ExportModal'
import { ImportExportBar } from '@/components/molecules/ImportExportBar'
import { ImportResultAlert } from '@/components/molecules/ImportResultAlert'
import { useEntityList } from '@/shared/hooks/useEntityList'
import { useImportExport } from '@/shared/hooks/useImportExport'
import type { Tracker } from '@/shared/types/api'
import { trackersApi } from '../api/trackers.api'
import { TrackerForm, type TrackerFormData } from '../components/TrackerForm'

let trackersPromise = trackersApi.getAll()

function TrackersList({ onEdit, onDelete, deletingIds }: { onEdit: (t: Tracker) => void; onDelete: (id: string) => void; deletingIds: Set<string> }) {
  const trackers = use(trackersPromise)

  if (!trackers.length) return <div className="py-12 text-center text-sm text-muted-foreground">Nenhum rastreador cadastrado.</div>

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-3 pr-4 font-medium">IMEI</th>
          <th className="py-3 pr-4 font-medium">Marca / Modelo</th>
          <th className="py-3 pr-4 font-medium">Veículo</th>
          <th className="py-3 pr-4 font-medium">Chip</th>
          <th className="py-3 font-medium">Ações</th>
        </tr>
      </thead>
      <tbody>
        {trackers.map((t) => (
          <tr key={t.id} className="border-b border-border hover:bg-muted/30">
            <td className="py-3 pr-4 font-mono">{t.imei}</td>
            <td className="py-3 pr-4">{t.brand} {t.model}</td>
            <td className="py-3 pr-4 text-muted-foreground">{t.vehicle?.plate ?? '—'}</td>
            <td className="py-3 pr-4">
              {t.chip ? <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">Vinculado</span>
                : <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Sem chip</span>}
            </td>
            <td className="py-3">
              <div className="flex gap-2">
                <button onClick={() => onEdit(t)} className="text-xs underline hover:text-primary">Editar</button>
                <button
                  onClick={() => onDelete(t.id)}
                  disabled={deletingIds.has(t.id)}
                  className="text-xs text-destructive underline hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingIds.has(t.id) ? (
                    <span className="flex items-center gap-1">
                      <Spinner className="h-3 w-3" />
                      Excluindo...
                    </span>
                  ) : 'Excluir'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function TrackersPage() {
  const [showExportModal, setShowExportModal] = useState(false)

  const { showForm, setShowForm, editing, setEditing, refresh, handleEdit, handleCancel, afterSubmit, handleDelete, deletingIds, invalidate } =
    useEntityList<Tracker>(trackersApi.remove, () => { trackersPromise = trackersApi.getAll() })

  const {
    importing, downloadingTemplate, exporting,
    importResult, importError, templateError, exportError,
    handleImport, handleTemplateDownload, handleExport,
  } = useImportExport(trackersApi, 'rastreadores', invalidate)

  const handleSubmit = async (data: TrackerFormData) => {
    if (editing) await trackersApi.update(editing.id, data)
    else await trackersApi.create(data)
    afterSubmit()
  }

  return (
    <div className="space-y-6" key={refresh}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Rastreadores</h1>
        <div className="flex items-center gap-3">
          <ImportExportBar
            onImport={handleImport}
            onTemplateDownload={handleTemplateDownload}
            onExportOpen={() => setShowExportModal(true)}
            importing={importing}
            downloadingTemplate={downloadingTemplate}
          />
          {!showForm && (
            <button onClick={() => { setEditing(null); setShowForm(true) }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Novo Rastreador
            </button>
          )}
        </div>
      </div>

      <ImportResultAlert result={importResult} error={importError || templateError} />

      {showForm ? (
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-base font-medium">{editing ? 'Editar Rastreador' : 'Novo Rastreador'}</h2>
          <TrackerForm initialData={editing ?? undefined} onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <TrackersList onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'Confirma exclusão?')} deletingIds={deletingIds} />
        </div>
      )}

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={async (from, to, format) => {
            const success = await handleExport(from, to, format)
            if (success) setShowExportModal(false)
          }}
          exporting={exporting}
          exportError={exportError}
        />
      )}
    </div>
  )
}
