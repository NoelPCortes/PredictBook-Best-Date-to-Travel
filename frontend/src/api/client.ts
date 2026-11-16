import { clearTokens, readTokens, writeTokens } from './authStorage'

export class ApiError extends Error {
  status: number
  fields: Record<string, unknown>
  constructor(status: number, fields: Record<string, unknown>) {
    super('API request failed')
    this.status = status
    this.fields = fields
  }
}

let refreshRequest: Promise<void> | null = null

function url(path: string) {
  const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
  if (!baseUrl) throw new Error('VITE_API_URL is not configured.')
  return `${baseUrl}${path}`
}

function expireSession() {
  clearTokens()
  window.dispatchEvent(new Event('auth:expired'))
}

async function refreshTokens() {
  const previous = readTokens()
  if (!previous) throw new Error('No refresh token.')
  const response = await fetch(url('/api/accounts/token/refresh/'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: previous.refresh }),
  })
  if (!response.ok) throw new Error('Refresh failed.')
  const tokens: unknown = await response.json()
  if (!tokens || typeof tokens !== 'object' || !('access' in tokens) || !('refresh' in tokens)
    || typeof tokens.access !== 'string' || typeof tokens.refresh !== 'string') {
    throw new Error('Invalid refresh response.')
  }
  // A response arriving after sign-out must not restore the session.
  if (readTokens()?.refresh !== previous.refresh) throw new Error('Session changed.')
  writeTokens({ access: tokens.access, refresh: tokens.refresh })
}

export async function apiRequest<T>(path: string, requestOptions: RequestInit | (() => RequestInit) = {}, isPublic = false): Promise<T> {
  async function send() {
    const options = typeof requestOptions === 'function' ? requestOptions() : requestOptions
    const headers = new Headers(options.headers)
    if (options.body) headers.set('Content-Type', 'application/json')
    const access = readTokens()?.access
    if (access && !isPublic) headers.set('Authorization', `Bearer ${access}`)
    return fetch(url(path), { ...options, headers })
  }
  const originalAccess = readTokens()?.access
  let response = await send()
  if (response.status === 401 && !isPublic) {
    try {
      if (readTokens()?.access === originalAccess) {
        refreshRequest ??= refreshTokens().finally(() => { refreshRequest = null })
        await refreshRequest
      }
      response = await send()
      if (response.status === 401) expireSession()
    } catch {
      expireSession()
      throw new ApiError(401, { detail: 'Please sign in again.' })
    }
  }
  const body: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(response.status, body && typeof body === 'object' ? body as Record<string, unknown> : {})
  }
  return body as T
}

export function fieldMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string').join(' ') || undefined
  return undefined
}
