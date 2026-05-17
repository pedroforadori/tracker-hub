import { use, useState } from 'react'
import type { Tracker } from '@/shared/types/api'
import { trackersApi } from '../api/trackers.api'
import { TrackerForm, type TrackerFormData } from '../components/TrackerForm'

let trackersPromise = trackersApi.getAll()

function TrackersList({ onEdit, onDelete }: { onEdit: (t: Tracker) => void; onDelete: (id: string) => void }) {
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
                <button onClick={() => onDelete(t.id)} className="text-xs text-destructive underline hover:opacity-80">Excluir</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function TrackersPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Tracker | null>(null)
  const [refresh, setRefresh] = useState(0)

  const invalidate = () => { trackersPromise = trackersApi.getAll(); setRefresh((n) => n + 1) }

  const handleSubmit = async (data: TrackerFormData) => {
    if (editing) await trackersApi.update(editing.id, data)
    else await trackersApi.create(data)
    setShowForm(false); setEditing(null); invalidate()
  }

  return (
    <div className="space-y-6" key={refresh}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rastreadores</h1>
        {!showForm && (
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            + Novo Rastreador
          </button>
        )}
      </div>

      {showForm ? (
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-base font-medium">{editing ? 'Editar Rastreador' : 'Novo Rastreador'}</h2>
          <TrackerForm initialData={editing ?? undefined} onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null) }} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <TrackersList onEdit={(t) => { setEditing(t); setShowForm(true) }}
            onDelete={async (id) => { if (confirm('Confirma exclusão?')) { await trackersApi.remove(id); invalidate() } }} />
        </div>
      )}
    </div>
  )
}
