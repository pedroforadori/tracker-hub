import { use, useState } from 'react'
import { Spinner } from '@/components/atoms/Spinner'
import { useEntityList } from '@/shared/hooks/useEntityList'
import type { Chip } from '@/shared/types/api'
import { chipsApi } from '../api/chips.api'
import { ChipForm, type ChipFormData } from '../components/ChipForm'

let chipsPromise = chipsApi.getAll()

function ChipsList({ onEdit, onDelete, deletingId }: { onEdit: (c: Chip) => void; onDelete: (id: string) => void; deletingId: string | null }) {
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
                <button
                  onClick={() => onDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="text-xs text-destructive underline hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === c.id ? (
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

export function ChipsPage() {
  const [serverError, setServerError] = useState('')

  const { showForm, setShowForm, editing, setEditing, refresh, handleEdit, handleCancel: baseHandleCancel, afterSubmit, handleDelete, deletingId } =
    useEntityList<Chip>(chipsApi.remove, () => { chipsPromise = chipsApi.getAll() })

  const handleCancel = () => {
    setServerError('')
    baseHandleCancel()
  }

  const handleSubmit = async (data: ChipFormData) => {
    setServerError('')
    try {
      if (editing) await chipsApi.update(editing.id, data)
      else await chipsApi.create(data)
      afterSubmit()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setServerError(msg ?? 'Erro ao salvar chip. Tente novamente.')
    }
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
          {serverError && (
            <div role="alert" className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <ChipForm initialData={editing ?? undefined} onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <ChipsList onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'Confirma exclusão?')} deletingId={deletingId} />
        </div>
      )}
    </div>
  )
}
