import { readPage } from './pagination'
import type { Forecast } from '../types/traffic'
import type { Flight } from '../types/flights'

export function loadForecasts(filters: { airport?: string; month?: string; mine?: boolean; page?: number; page_size?: number } = {}) {
  const query = new URLSearchParams()
  if (filters.airport) query.set('airport', filters.airport)
  if (filters.month) query.set('month', filters.month)
  if (filters.page) query.set('page', String(filters.page))
  if (filters.page_size) query.set('page_size', String(filters.page_size))
  if (filters.mine) query.set('mine', 'true')
  return readPage<Forecast>(`/api/traffic/forecasts/${query.size ? `?${query}` : ''}`)
}

export function loadFlights(filters: { origin?: string; airport?: string; date?: string; mine?: boolean; page?: number; page_size?: number } = {}) {
  const query = new URLSearchParams()
  if (filters.origin) query.set('origin', filters.origin)
  if (filters.airport) query.set('airport', filters.airport)
  if (filters.date) query.set('date', filters.date)
  if (filters.page) query.set('page', String(filters.page))
  if (filters.page_size) query.set('page_size', String(filters.page_size))
  if (filters.mine) query.set('mine', 'true')
  return readPage<Flight>(`/api/flights/${query.size ? `?${query}` : ''}`)
}
