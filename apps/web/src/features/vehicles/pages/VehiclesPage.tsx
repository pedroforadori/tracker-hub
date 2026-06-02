import { use, useState } from 'react'
import { Plus } from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner'
import { ExportModal } from '@/components/molecules/ExportModal'
import { ImportExportBar } from '@/components/molecules/ImportExportBar'
import { ImportResultAlert } from '@/components/molecules/ImportResultAlert'
import { useEntityList } from '@/shared/hooks/useEntityList'
import { useImportExport } from '@/shared/hooks/useImportExport'
import type { Vehicle } from '@/shared/types/api'
import { getVehiclesPromise, invalidateVehicles } from '@/shared/store/entityPromises'
import { vehiclesApi } from '../api/vehicles.api'
import { VehicleForm, type VehicleFormData } from '../components/VehicleForm'

function VehiclesList({ onEdit, onDelete, deletingIds }: { onEdit: (v: Vehicle) => void; onDelete: (id: string) => void; deletingIds: Set<string> }) {
  const vehicles = use(getVehiclesPromise())

  if (!vehicles.length) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Nenhum veículo cadastrado.</div>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-3 pr-4 font-medium">Placa</th>
          <th className="py-3 pr-4 font-medium">Marca / Modelo</th>
          <th className="py-3 pr-4 font-medium">Ano</th>
          <th className="py-3 pr-4 font-medium">Cliente</th>
          <th className="py-3 font-medium">Ações</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((v) => (
          <tr key={v.id} className="border-b border-border hover:bg-muted/30">
            <td className="py-3 pr-4 font-mono font-medium">{v.plate}</td>
            <td className="py-3 pr-4">{v.brand} {v.model}</td>
            <td className="py-3 pr-4">{v.year}</td>
            <td className="py-3 pr-4 text-muted-foreground">{v.customer?.name ?? '—'}</td>
            <td className="py-3">
              <div className="flex gap-2">
                <button onClick={() => onEdit(v)} className="text-xs underline hover:text-primary">Editar</button>
                <button
                  onClick={() => onDelete(v.id)}
                  disabled={deletingIds.has(v.id)}
                  className="text-xs text-destructive underline hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingIds.has(v.id) ? (
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

export function VehiclesPage() {
  const [showExportModal, setShowExportModal] = useState(false)

  const { showForm, setShowForm, editing, setEditing, refresh, handleEdit, handleCancel, afterSubmit, handleDelete, deletingIds, invalidate } =
    useEntityList<Vehicle>(vehiclesApi.remove, () => { invalidateVehicles() })

  const {
    importing, downloadingTemplate, exporting,
    importResult, importError, templateError, exportError,
    handleImport, handleTemplateDownload, handleExport,
  } = useImportExport(vehiclesApi, 'veiculos', invalidate)

  const handleSubmit = async (data: VehicleFormData) => {
    if (editing) await vehiclesApi.update(editing.id, data)
    else await vehiclesApi.create(data)
    afterSubmit()
  }

  return (
    <div className="space-y-6" key={refresh}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Veículos</h1>
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
              Novo Veículo
            </button>
          )}
        </div>
      </div>

      <ImportResultAlert result={importResult} error={importError || templateError} />

      {showForm ? (
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-base font-medium">{editing ? 'Editar Veículo' : 'Novo Veículo'}</h2>
          <VehicleForm initialData={editing ?? undefined} onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <VehiclesList onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'Confirma exclusão?')} deletingIds={deletingIds} />
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
