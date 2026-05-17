import { use, useState } from 'react'
import { useAuthStore } from '@/shared/store/authStore'
import type { TeamMember } from '@/shared/types/api'
import { teamApi } from '../api/team.api'
import { TeamForm, type TeamFormData } from '../components/TeamForm'

const MAX_SECONDARY_USERS = 3

let teamPromise = teamApi.getAll()

function TeamList({ onEdit, onDelete }: { onEdit: (m: TeamMember) => void; onDelete: (id: string) => void }) {
  const members = use(teamPromise)
  const { user: currentUser } = useAuthStore()

  const secondary = members.filter((m) => m.role === 'USER')
  const usedCount = secondary.length
  const pct = Math.round((usedCount / MAX_SECONDARY_USERS) * 100)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Usuários adicionais</span>
          <span className="text-muted-foreground">
            {usedCount} de {MAX_SECONDARY_USERS} utilizados
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-destructive' : 'bg-primary'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {members.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Nenhum membro na equipe.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-3 pr-4 font-medium">Nome</th>
              <th className="py-3 pr-4 font-medium">E-mail</th>
              <th className="py-3 pr-4 font-medium">Função</th>
              <th className="py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border hover:bg-muted/30">
                <td className="py-3 pr-4 font-medium">{m.name}</td>
                <td className="py-3 pr-4">{m.email}</td>
                <td className="py-3 pr-4">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${m.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {m.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                  </span>
                </td>
                <td className="py-3">
                  {m.id !== currentUser?.id && m.role !== 'ADMIN' && (
                    <div className="flex gap-2">
                      <button onClick={() => onEdit(m)} className="text-xs underline hover:text-primary">Editar</button>
                      <button onClick={() => onDelete(m.id)} className="text-xs text-destructive underline hover:opacity-80">Remover</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function TeamPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [isLimited, setIsLimited] = useState(false)

  const invalidate = () => {
    teamPromise = teamApi.getAll()
    teamPromise.then((members) => {
      setIsLimited(members.filter((m) => m.role === 'USER').length >= MAX_SECONDARY_USERS)
    })
    setRefresh((n) => n + 1)
  }

  const handleSubmit = async (data: TeamFormData) => {
    try {
      if (editing) await teamApi.update(editing.id, data)
      else await teamApi.create(data)
      setShowForm(false)
      setEditing(null)
      invalidate()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      alert(message)
    }
  }

  return (
    <div className="space-y-6" key={refresh}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Equipe</h1>
        {!showForm && (
          <div title={isLimited ? 'Limite de 3 usuários adicionais atingido' : undefined}>
            <button
              onClick={() => { setEditing(null); setShowForm(true) }}
              disabled={isLimited}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Adicionar Membro
            </button>
          </div>
        )}
      </div>

      {showForm ? (
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-base font-medium">{editing ? 'Editar Membro' : 'Adicionar Membro'}</h2>
          <TeamForm
            initialData={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      ) : (
        <TeamList
          onEdit={(m) => { setEditing(m); setShowForm(true) }}
          onDelete={async (id) => {
            if (confirm('Confirma remoção do membro?')) {
              await teamApi.remove(id)
              invalidate()
            }
          }}
        />
      )}
    </div>
  )
}
