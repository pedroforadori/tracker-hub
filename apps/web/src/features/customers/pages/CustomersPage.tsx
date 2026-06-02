'use client'
import { use, useState } from 'react'
import { Plus } from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner'
import { Switch } from '@/components/atoms/Switch'
import { ExportModal } from '@/components/molecules/ExportModal'
import { ImportExportBar } from '@/components/molecules/ImportExportBar'
import { ImportResultAlert } from '@/components/molecules/ImportResultAlert'
import { useEntityList } from '@/shared/hooks/useEntityList'
import { useImportExport } from '@/shared/hooks/useImportExport'
import type { Customer, CustomerStatus } from '@/shared/types/api'
import { getCustomersPromise, invalidateCustomers, patchCustomerStatus } from '@/shared/store/entityPromises'
import { customersApi } from '../api/customers.api'
import { CustomerForm, type CustomerFormData } from '../components/CustomerForm'

function CustomersList({
  statusOverrides,
  pendingIds,
  deletingIds,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  statusOverrides: Record<string, CustomerStatus>
  pendingIds: Set<string>
  deletingIds: Set<string>
  onEdit: (c: Customer) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: CustomerStatus) => void
}) {
  // use() fica no filho para que apenas a lista suspenda, e não a página inteira.
  // Isso preserva o header e o formulário aberto durante um refetch.
  const serverCustomers = use(getCustomersPromise())

  // Aplica overrides otimistas sobre os dados do servidor.
  const customers = serverCustomers.map((c) => ({
    ...c,
    status: statusOverrides[c.id] ?? c.status,
  }))

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
            <th className="py-3 pr-4 font-medium">E-mail</th>
            <th className="py-3 pr-4 font-medium">Mensalidade</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            <th className="py-3 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const isAtivo = c.status === 'ATIVO'
            return (
              <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                <td className="py-3 pr-4 font-medium">{c.name}</td>
                <td className="py-3 pr-4">{c.email}</td>
                <td className="py-3 pr-4">
                  {Number(c.monthlyFee).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isAtivo}
                      disabled={pendingIds.has(c.id)}
                      onChange={(checked) => onStatusChange(c.id, checked ? 'ATIVO' : 'INATIVO')}
                    />
                    <span className="text-xs text-muted-foreground">{isAtivo ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(c)} className="text-xs underline hover:text-primary">
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      disabled={deletingIds.has(c.id)}
                      className="text-xs text-destructive underline hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingIds.has(c.id) ? (
                        <span className="flex items-center gap-1">
                          <Spinner className="h-3 w-3" />
                          Excluindo...
                        </span>
                      ) : 'Excluir'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function CustomersPage() {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, CustomerStatus>>({})
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [showExportModal, setShowExportModal] = useState(false)

  const { showForm, setShowForm, editing, setEditing, handleEdit, handleCancel, afterSubmit, handleDelete, deletingIds, invalidate } =
    useEntityList<Customer>(customersApi.remove, () => {
      invalidateCustomers()
      setStatusOverrides({})
    })

  const {
    importing, downloadingTemplate, exporting,
    importResult, importError, templateError, exportError,
    handleImport, handleTemplateDownload, handleExport,
  } = useImportExport(customersApi, 'clientes', invalidate)

  const handleSubmit = async (data: CustomerFormData) => {
    if (editing) await customersApi.update(editing.id, data)
    else await customersApi.create(data)
    afterSubmit()
  }

  const handleStatusChange = async (id: string, status: CustomerStatus) => {
    // Atualização otimista imediata para feedback visual instantâneo.
    setStatusOverrides(prev => ({ ...prev, [id]: status }))
    setPendingIds(prev => new Set(prev).add(id))
    try {
      await customersApi.update(id, { status })
      // Sucesso: patcha o cache sem refetch. Em caso de erro, o finally
      // remove o override, revertendo para o valor original do servidor.
      patchCustomerStatus(id, status)
    } finally {
      setStatusOverrides(prev => { const n = { ...prev }; delete n[id]; return n })
      setPendingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <div className="flex items-center gap-3">
          <ImportExportBar
            onImport={handleImport}
            onTemplateDownload={handleTemplateDownload}
            onExportOpen={() => setShowExportModal(true)}
            importing={importing}
            downloadingTemplate={downloadingTemplate}
          />
          {!showForm && (
            <button
              onClick={() => { setEditing(null); setShowForm(true) }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Novo Cliente
            </button>
          )}
        </div>
      </div>

      <ImportResultAlert result={importResult} error={importError || templateError} />

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
          statusOverrides={statusOverrides}
          pendingIds={pendingIds}
          deletingIds={deletingIds}
          onEdit={handleEdit}
          onDelete={(id) => handleDelete(id, 'Confirma exclusão do cliente? Todos os veículos vinculados serão removidos.')}
          onStatusChange={handleStatusChange}
        />
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
