import { apiRequest } from '../../api/client'
import type { Profile } from '../../types/auth'

export function loadProfile() {
  return apiRequest<Profile>('/api/accounts/profile/')
}

export { logout } from '../../api/session'
