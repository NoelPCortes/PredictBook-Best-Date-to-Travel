import { apiRequest } from './client'
import { readTokens } from './authStorage'

export function logout() {
  return apiRequest<{ detail: string }>('/api/accounts/logout/', () => ({
    method: 'POST', body: JSON.stringify({ refresh: readTokens()?.refresh }),
  }))
}
