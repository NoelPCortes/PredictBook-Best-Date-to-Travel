import { ApiError, apiRequest } from './client'

export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] }
export type Records<T> = T[] & { count?: number; next?: string | null; previous?: string | null }
export function records<T>(page: Page<T> | T[]): Records<T> {
  if (Array.isArray(page) || !page || !Array.isArray(page.results) || !Number.isInteger(page.count) || page.count < 0) {
    throw new ApiError(502, { detail: 'The server returned an outdated list response. Restart the backend with the current project code, then retry.' })
  }
  return Object.assign(page.results, { count: page.count, next: page.next, previous: page.previous })
}
export async function readPage<T>(path: string): Promise<Records<T>> { return records(await apiRequest<Page<T>>(path)) }
export async function readLookup<T>(path: string): Promise<T[]> {
  const result: T[] = []
  let page = 1
  for (;;) {
    const current = await readPage<T>(`${path}${page > 1 ? `?page=${page}` : ''}`)
    result.push(...current)
    if (!current.next) return result
    page += 1
  }
}
