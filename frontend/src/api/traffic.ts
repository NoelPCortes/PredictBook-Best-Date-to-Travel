import { apiRequest } from './client'
import type { Forecast } from '../types/traffic'
import type { Flight } from '../types/flights'

export function loadForecasts(filters: { airport?: string; month?: string; mine?: boolean } = {}) {
  const query = new URLSearchParams()
  if (filters.airport) query.set('airport', filters.airport)
  if (filters.month) query.set('month', filters.month)
  if (filters.mine) query.set('mine', 'true')
  return apiRequest<Forecast[]>(`/api/traffic/forecasts/${query.size ? `?${query}` : ''}`)
}

export function loadFlights(filters: { origin?: string; airport?: string; date?: string; mine?: boolean } = {}) {
  const query = new URLSearchParams()
  if (filters.origin) query.set('origin', filters.origin)
  if (filters.airport) query.set('airport', filters.airport)
  if (filters.date) query.set('date', filters.date)
  if (filters.mine) query.set('mine', 'true')
  return apiRequest<Flight[]>(`/api/flights/${query.size ? `?${query}` : ''}`)
}
