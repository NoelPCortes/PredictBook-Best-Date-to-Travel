import type { Tokens } from '../types/auth'

const ACCESS_KEY = 'predictbook.access'
const REFRESH_KEY = 'predictbook.refresh'

export function readTokens(): Tokens | null {
  const access = localStorage.getItem(ACCESS_KEY)
  const refresh = localStorage.getItem(REFRESH_KEY)
  return access && refresh ? { access, refresh } : null
}

export function writeTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access)
  localStorage.setItem(REFRESH_KEY, tokens.refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
