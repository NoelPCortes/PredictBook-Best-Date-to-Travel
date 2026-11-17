import { records } from '../../api/pagination'
import type { Page } from '../../api/pagination'
import { apiRequest } from '../../api/client'

export type StaffLists = {
  staff: { id: number; username: string; email: string }[]
  pending: { email: string; assigned_by_username: string; assigned_at: string }[]
}

export async function getStaffList(staffPage = 1, pendingPage = 1, search = '') {
  const result = await apiRequest<{ staff: Page<StaffLists['staff'][number]>; pending: Page<StaffLists['pending'][number]> }>(`/api/accounts/staff/?staff_page=${staffPage}&pending_page=${pendingPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
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

export type StaffDetails = { id: number; username: string; email: string; first_name: string; last_name: string; date_joined: string; flights_created: number; forecasts_created: number }
export function getStaffDetails(id: number) { return apiRequest<StaffDetails>(`/api/accounts/staff/${id}/`) }
