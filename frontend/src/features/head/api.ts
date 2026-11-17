import { records } from '../../api/pagination'
import type { Page } from '../../api/pagination'
import { apiRequest } from '../../api/client'

export type StaffLists = {
  staff: { username: string; email: string }[]
  pending: { email: string; assigned_by_username: string; assigned_at: string }[]
}

export async function getStaffList(staffPage = 1, pendingPage = 1) {
  const result = await apiRequest<{ staff: Page<StaffLists['staff'][number]>; pending: Page<StaffLists['pending'][number]> }>(`/api/accounts/staff/?staff_page=${staffPage}&pending_page=${pendingPage}`)
  return { staff: records(result.staff), pending: records(result.pending) }
}
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
