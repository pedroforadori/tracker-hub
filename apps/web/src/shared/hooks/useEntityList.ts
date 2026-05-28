import { useCallback, useRef, useState } from 'react'

export function useEntityList<T extends { id: string }>(
  removeFn: (id: string) => Promise<unknown>,
  invalidatePromise: () => void,
) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Update refs during render so callbacks always call the latest version,
  // even when callers pass new inline lambdas on every render.
  const removeFnRef = useRef(removeFn)
  const invalidatePromiseRef = useRef(invalidatePromise)
  removeFnRef.current = removeFn
  invalidatePromiseRef.current = invalidatePromise

  const invalidate = useCallback(() => {
    invalidatePromiseRef.current()
    setRefresh((n) => n + 1)
  }, [])

  const handleEdit = useCallback((item: T) => {
    setEditing(item)
    setShowForm(true)
  }, [])

  const handleCancel = useCallback(() => {
    setShowForm(false)
    setEditing(null)
  }, [])

  const afterSubmit = useCallback(() => {
    setShowForm(false)
    setEditing(null)
    invalidate()
  }, [invalidate])

  const handleDelete = useCallback(async (id: string, confirmMessage = 'Confirma exclusão?') => {
    if (!window.confirm(confirmMessage)) return
    setDeletingId(id)
    try {
      await removeFnRef.current(id)
      invalidate()
    } finally {
      setDeletingId(null)
    }
  }, [invalidate])

  return { showForm, setShowForm, editing, setEditing, refresh, handleEdit, handleCancel, afterSubmit, handleDelete, invalidate, deletingId }
}
