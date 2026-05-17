import { use, useState } from 'react'
import type { Chip } from '@/shared/types/api'
import { chipsApi } from '../api/chips.api'
import { ChipForm, type ChipFormData } from '../components/ChipForm'

let chipsPromise = chipsApi.getAll()

function ChipsList({ onEdit, onDelete }: { onEdit: (c: Chip) => void; onDelete: (id: string) => void }) {
  const chips = use(chipsPromise)

  if (!chips.length) return <div className="py-12 text-center text-sm text-muted-foreground">Nenhum chip cadastrado.</div>

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-3 pr-4 font-medium">ICCID</th>
          <th className="py-3 pr-4 font-medium">Número</th>
          <th className="py-3 pr-4 font-medium">Operadora</th>
          <th className="py-3 pr-4 font-medium">Rastreador</th>
          <th className="py-3 font-medium">Ações</th>
        </tr>
      </thead>
      <tbody>
        {chips.map((c) => (
          <tr key={c.id} className="border-b border-border hover:bg-muted/30">
            <td className="py-3 pr-4 font-mono text-xs">{c.iccid}</td>
            <td className="py-3 pr-4">{c.phoneNumber}</td>
            <td className="py-3 pr-4">{c.provider}</td>
            <td className="py-3 pr-4 text-muted-foreground">{c.tracker?.imei ?? '—'}</td>
            <td className="py-3">
              <div className="flex gap-2">
                <button onClick={() => onEdit(c)} className="text-xs underline hover:text-primary">Editar</button>
                <button onClick={() => onDelete(c.id)} className="text-xs text-destructive underline hover:opacity-80">Excluir</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ChipsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Chip | null>(null)
  const [refresh, setRefresh] = useState(0)

  const invalidate = () => { chipsPromise = chipsApi.getAll(); setRefresh((n) => n + 1) }

  const handleSubmit = async (data: ChipFormData) => {
    if (editing) await chipsApi.update(editing.id, data)
    else await chipsApi.create(data)
    setShowForm(false); setEditing(null); invalidate()
  }

  return (
    <div className="space-y-6" key={refresh}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chips</h1>
        {!showForm && (
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            + Novo Chip
          </button>
        )}
      </div>

      {showForm ? (
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-base font-medium">{editing ? 'Editar Chip' : 'Novo Chip'}</h2>
          <ChipForm initialData={editing ?? undefined} onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null) }} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <ChipsList onEdit={(c) => { setEditing(c); setShowForm(true) }}
            onDelete={async (id) => { if (confirm('Confirma exclusão?')) { await chipsApi.remove(id); invalidate() } }} />
        </div>
      )}
    </div>
  )
}
