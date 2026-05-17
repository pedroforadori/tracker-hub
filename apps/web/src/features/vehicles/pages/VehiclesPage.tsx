import { use } from 'react'
import { useEntityList } from '@/shared/hooks/useEntityList'
import type { Vehicle } from '@/shared/types/api'
import { vehiclesApi } from '../api/vehicles.api'
import { VehicleForm, type VehicleFormData } from '../components/VehicleForm'

let vehiclesPromise = vehiclesApi.getAll()

function VehiclesList({ onEdit, onDelete }: { onEdit: (v: Vehicle) => void; onDelete: (id: string) => void }) {
  const vehicles = use(vehiclesPromise)

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
                <button onClick={() => onDelete(v.id)} className="text-xs text-destructive underline hover:opacity-80">Excluir</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function VehiclesPage() {
  const { showForm, setShowForm, editing, setEditing, refresh, handleEdit, handleCancel, afterSubmit, handleDelete } =
    useEntityList<Vehicle>(vehiclesApi.remove, () => { vehiclesPromise = vehiclesApi.getAll() })

  const handleSubmit = async (data: VehicleFormData) => {
    if (editing) await vehiclesApi.update(editing.id, data)
    else await vehiclesApi.create(data)
    afterSubmit()
  }

  return (
    <div className="space-y-6" key={refresh}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Veículos</h1>
        {!showForm && (
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            + Novo Veículo
          </button>
        )}
      </div>

      {showForm ? (
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-base font-medium">{editing ? 'Editar Veículo' : 'Novo Veículo'}</h2>
          <VehicleForm initialData={editing ?? undefined} onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <VehiclesList onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'Confirma exclusão?')} />
        </div>
      )}
    </div>
  )
}
