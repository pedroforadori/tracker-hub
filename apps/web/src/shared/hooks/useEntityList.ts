import { useCallback, useEffect, useRef, useState } from 'react'

export function useEntityList<T extends { id: string }>(
  removeFn: (id: string) => Promise<unknown>,
  invalidatePromise: () => void,
) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [refresh, setRefresh] = useState(0)

  // Capture caller-provided functions in refs so callbacks below remain stable
  // even when callers pass new inline lambdas on every render.
  const removeFnRef = useRef(removeFn)
  const invalidatePromiseRef = useRef(invalidatePromise)
  useEffect(() => { removeFnRef.current = removeFn }, [removeFn])
  useEffect(() => { invalidatePromiseRef.current = invalidatePromise }, [invalidatePromise])

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
    await removeFnRef.current(id)
    invalidate()
  }, [invalidate])

  return { showForm, setShowForm, editing, setEditing, refresh, handleEdit, handleCancel, afterSubmit, handleDelete, invalidate }
}
