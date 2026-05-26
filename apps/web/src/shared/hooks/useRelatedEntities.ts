import { useEffect, useRef, useState } from 'react'

export function useRelatedEntities<T>(fetcher: () => Promise<T[]>): T[] {
  const [items, setItems] = useState<T[]>([])
  // Capture the fetcher reference on mount only — callers typically pass inline arrows
  // and we intentionally run this once, not on every render.
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    let mounted = true
    fetcherRef.current()
      .then((data) => { if (mounted) setItems(data) })
      .catch((err) => { if (mounted) console.error('[useRelatedEntities]', err) })
    return () => { mounted = false }
  }, [])

  return items
}
