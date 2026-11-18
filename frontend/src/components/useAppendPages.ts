import { useEffect, useState } from 'react'
import { ApiError, fieldMessage } from '../api/client'
import type { Records } from '../api/pagination'

type Result<T> = { key: string; rows: T[]; count: number; page: number; hasMore: boolean; loading: boolean; error?: string }

export function useAppendPages<T>(key: string, load: (page: number) => Promise<Records<T>>) {
  const [result, setResult] = useState<Result<T>>()
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    void load(1).then(rows => {
      if (active) setResult({ key, rows, count: rows.count ?? rows.length, page: 1, hasMore: Boolean(rows.next), loading: false })
    }).catch(error => {
      if (active) setResult({ key, rows: [], count: 0, page: 0, hasMore: false, loading: false, error: error instanceof ApiError ? fieldMessage(error.fields.detail) ?? 'Unable to load flights. Please try again.' : 'Unable to load flights. Please try again.' })
    })
    return () => { active = false }
  }, [key, load, attempt])
  async function seeMore() {
    if (!result || result.key !== key || result.loading) return
    const previous = result
    setResult({ ...previous, loading: true, error: undefined })
    try {
      const rows = await load(previous.page + 1)
      setResult(current => current?.key !== key ? current : { key, rows: [...previous.rows, ...rows], count: rows.count ?? previous.count, page: previous.page + 1, hasMore: Boolean(rows.next), loading: false })
    } catch {
      setResult(current => current?.key !== key ? current : { ...previous, loading: false, error: 'Unable to load more flights. Please try again.' })
    }
  }
  return { result: result?.key === key ? result : undefined, seeMore, retry: () => { setResult(undefined); setAttempt(value => value + 1) } }
}
