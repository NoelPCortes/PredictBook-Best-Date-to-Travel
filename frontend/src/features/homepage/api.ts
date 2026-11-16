import { apiRequest } from '../../api/client'
import { readTokens } from '../../api/authStorage'
import type { Profile } from '../../types/auth'

export function loadProfile() {
  return apiRequest<Profile>('/api/accounts/profile/')
}

export function logout() {
  return apiRequest<{ detail: string }>('/api/accounts/logout/', () => ({
    method: 'POST', body: JSON.stringify({ refresh: readTokens()?.refresh }),
  }))
}
