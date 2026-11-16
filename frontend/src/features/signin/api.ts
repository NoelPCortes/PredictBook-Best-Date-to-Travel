import { apiRequest } from '../../api/client'
import type { SigninResponse } from '../../types/auth'

export function signin(identifier: string, password: string) {
  return apiRequest<SigninResponse>('/api/accounts/signin/', {
    method: 'POST', body: JSON.stringify({ identifier, password }),
  }, true)
}
