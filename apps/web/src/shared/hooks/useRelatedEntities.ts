import { useEffect, useRef, useState } from 'react'

export function useRelatedEntities<T>(fetcher: () => Promise<T[]>): T[] {
  const [items, setItems] = useState<T[]>([])
  // Capture the fetcher reference on mount only — callers typically pass inline arrows
  // and we intentionally run this once, not on every render.
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current().then(setItems).catch((err) => console.error('[useRelatedEntities]', err))
  }, [])

  return items
}
