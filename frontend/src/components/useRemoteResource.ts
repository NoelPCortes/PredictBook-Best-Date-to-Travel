import { useEffect, useState } from 'react'

export function useRemoteResource<T>(key: string, load: () => Promise<T>) {
  const [result, setResult] = useState<{ key: string; value?: T; error?: string }>()
  useEffect(() => {
    let isActive = true
    void load().then(value => { if (isActive) setResult({ key, value }) })
      .catch(() => { if (isActive) setResult({ key, error: 'Unable to load data. Please try again.' }) })
    return () => { isActive = false }
  }, [key, load])
  return result?.key === key ? result : { key }
}
