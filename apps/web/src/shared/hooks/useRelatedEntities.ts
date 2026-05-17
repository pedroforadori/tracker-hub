import { useEffect, useState } from 'react'

export function useRelatedEntities<T>(fetcher: () => Promise<T[]>): T[] {
  const [items, setItems] = useState<T[]>([])

  useEffect(() => {
    fetcher().then(setItems).catch((err) => console.error('[useRelatedEntities]', err))
    // fetcher é arrow function inline nos callers — adicioná-la nas deps causaria loop infinito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return items
}
