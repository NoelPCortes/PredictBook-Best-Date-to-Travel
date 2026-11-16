import { apiRequest } from '../../api/client'
import { loadFlights, loadForecasts } from '../../api/traffic'

export function getDashboardAccess() {
  return apiRequest<{ detail: string; is_sample: boolean }>('/api/dashboard/')
}

export async function getOwnRecordCounts() {
  const [flights, forecasts] = await Promise.all([loadFlights({ mine: true }), loadForecasts({ mine: true })])
  return { flights: flights.length, forecasts: forecasts.length }
}
