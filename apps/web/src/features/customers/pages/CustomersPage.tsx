'use client'
import { use } from 'react'
import { useEntityList } from '@/shared/hooks/useEntityList'
import type { Customer } from '@/shared/types/api'
import { customersApi } from '../api/customers.api'
import { CustomerForm, type CustomerFormData } from '../components/CustomerForm'

let customersPromise = customersApi.getAll()

function CustomersList({
  onEdit,
  onDelete,
}: {
  onEdit: (c: Customer) => void
  onDelete: (id: string) => void
}) {
  const customers = use(customersPromise)

  if (!customers.length) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Nenhum cliente cadastrado. Clique em &quot;Novo Cliente&quot; para começar.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-3 pr-4 font-medium">Nome</th>
            <th className="py-3 pr-4 font-medium">CNPJ</th>
            <th className="py-3 pr-4 font-medium">E-mail</th>
            <th className="py-3 pr-4 font-medium">Telefone</th>
            <th className="py-3 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-b border-border hover:bg-muted/30">
              <td className="py-3 pr-4 font-medium">{c.name}</td>
              <td className="py-3 pr-4 text-muted-foreground">{c.cnpj}</td>
              <td className="py-3 pr-4">{c.email}</td>
              <td className="py-3 pr-4">{c.phone}</td>
              <td className="py-3">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(c)} className="text-xs underline hover:text-primary">
                    Editar
                  </button>
                  <button onClick={() => onDelete(c.id)} className="text-xs text-destructive underline hover:opacity-80">
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CustomersPage() {
  const { showForm, setShowForm, editing, setEditing, refresh, handleEdit, handleCancel, afterSubmit, handleDelete } =
    useEntityList<Customer>(customersApi.remove, () => { customersPromise = customersApi.getAll() })

  const handleSubmit = async (data: CustomerFormData) => {
    if (editing) await customersApi.update(editing.id, data)
    else await customersApi.create(data)
    afterSubmit()
  }

  return (
    <div className="space-y-6" key={refresh}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        {!showForm && (
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            + Novo Cliente
          </button>
        )}
      </div>

      {showForm ? (
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-base font-medium">
            {editing ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <CustomerForm
            initialData={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <CustomersList
          onEdit={handleEdit}
          onDelete={(id) => handleDelete(id, 'Confirma exclusão do cliente? Todos os veículos vinculados serão removidos.')}
        />
      )}
    </div>
  )
}
