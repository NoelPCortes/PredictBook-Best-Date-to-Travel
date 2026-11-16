import { apiRequest } from '../../api/client'
import type { Profile } from '../../types/auth'

export type ProfileFields = Pick<Profile, 'username' | 'email' | 'first_name' | 'last_name'>

export function updateProfile(fields: ProfileFields) {
  const { username, email, first_name, last_name } = fields
  return apiRequest<Profile>('/api/accounts/profile/', {
    method: 'PATCH', body: JSON.stringify({ username, email, first_name, last_name }),
  })
}

export function changePassword(current_password: string, new_password: string) {
  return apiRequest<{ detail: string }>('/api/accounts/password/change/', {
    method: 'POST', body: JSON.stringify({ current_password, new_password }),
  })
}
