import { useState } from 'react'

export function useEntityList<T extends { id: string }>(
  removeFn: (id: string) => Promise<unknown>,
  invalidatePromise: () => void,
) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [refresh, setRefresh] = useState(0)

  const invalidate = () => {
    invalidatePromise()
    setRefresh((n) => n + 1)
  }

  const handleEdit = (item: T) => {
    setEditing(item)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditing(null)
  }

  const afterSubmit = () => {
    setShowForm(false)
    setEditing(null)
    invalidate()
  }

  const handleDelete = async (id: string, confirmMessage = 'Confirma exclusão?') => {
    if (!window.confirm(confirmMessage)) return
    await removeFn(id)
    invalidate()
  }

  return { showForm, setShowForm, editing, setEditing, refresh, handleEdit, handleCancel, afterSubmit, handleDelete, invalidate }
}
