import { apiRequest } from '../../api/client'

export function getHeadAccess() {
  return apiRequest<{ detail: string }>('/api/accounts/head/')
}

export function assignStaff(email: string) {
  return apiRequest<{ detail: string }>('/api/accounts/staff/assign/', {
    method: 'POST', body: JSON.stringify({ email }),
  })
}
