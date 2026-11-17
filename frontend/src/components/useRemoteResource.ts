import { useEffect, useState } from 'react'
import { ApiError, fieldMessage } from '../api/client'

export function useRemoteResource<T>(key: string, load: () => Promise<T>) {
  const [result, setResult] = useState<{ key: string; value?: T; error?: string }>()
  useEffect(() => {
    let isActive = true
    void load().then(value => { if (isActive) setResult({ key, value }) })
      .catch(error => { if (isActive) setResult({ key, error: error instanceof ApiError ? fieldMessage(error.fields.detail) ?? fieldMessage(error.fields.non_field_errors) ?? 'Unable to load data. Please try again.' : 'Unable to load data. Please try again.' }) })
    return () => { isActive = false }
  }, [key, load])
  return result?.key === key ? result : { key }
}
