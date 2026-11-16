import { apiRequest } from '../../api/client'

export function getDashboardAccess() {
  return apiRequest<{ detail: string; is_sample: boolean }>('/api/dashboard/')
}
