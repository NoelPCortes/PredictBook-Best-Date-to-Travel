import { apiRequest } from '../../api/client'

export type StaffLists = {
  staff: { username: string; email: string }[]
  pending: { email: string; assigned_by_username: string; assigned_at: string }[]
}

export function getStaffList() { return apiRequest<StaffLists>('/api/accounts/staff/') }
export function revokeStaff(email: string) {
  return apiRequest<{ detail: string }>('/api/accounts/staff/revoke/', { method: 'POST', body: JSON.stringify({ email }) })
}

export function getHeadAccess() {
  return apiRequest<{ detail: string }>('/api/accounts/head/')
}

export function assignStaff(email: string) {
  return apiRequest<{ detail: string }>('/api/accounts/staff/assign/', {
    method: 'POST', body: JSON.stringify({ email }),
  })
}
