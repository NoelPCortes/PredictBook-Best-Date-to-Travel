import { apiRequest } from '../../api/client'
import { loadFlights, loadForecasts } from '../../api/traffic'
import type { DashboardSummary } from './types'

export function getDashboardAccess() {
  return apiRequest<{ detail: string; is_sample: boolean }>('/api/dashboard/')
}

export function getDashboardSummary(airport?: string) {
  return apiRequest<DashboardSummary>(`/api/dashboard/summary/${airport ? `?airport=${encodeURIComponent(airport)}` : ''}`)
}

export async function getOwnRecordCounts() {
  const [flights, forecasts] = await Promise.all([loadFlights({ mine: true, page_size: 1 }), loadForecasts({ mine: true, page_size: 1 })])
  return { flights: flights.count ?? flights.length, forecasts: forecasts.count ?? forecasts.length }
}
