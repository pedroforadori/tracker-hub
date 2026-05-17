import { useEffect, useState } from 'react'

export function useRelatedEntities<T>(fetcher: () => Promise<T[]>): T[] {
  const [items, setItems] = useState<T[]>([])

  useEffect(() => {
    fetcher().then(setItems).catch(() => {})
  }, [])

  return items
}
