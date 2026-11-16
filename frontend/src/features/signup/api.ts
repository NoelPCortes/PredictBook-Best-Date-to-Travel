import { apiRequest } from '../../api/client'
import type { Profile } from '../../types/auth'

type SignupFields = {
  username: string; email: string; password: string
  first_name?: string; last_name?: string
}

export function signup(fields: SignupFields) {
  const { username, email, password, first_name, last_name } = fields
  return apiRequest<Profile>('/api/accounts/signup/', {
    method: 'POST', body: JSON.stringify({ username, email, password, first_name, last_name }),
  }, true)
}
