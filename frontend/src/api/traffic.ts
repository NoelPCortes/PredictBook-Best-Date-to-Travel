import { apiRequest } from './client'
import { readPage } from './pagination'
import type { Forecast } from '../types/traffic'
import type { Flight } from '../types/flights'

export function loadForecasts(filters: { airport?: string; month?: string; search?: string; level?: string; source?: string; mine?: boolean; page?: number; page_size?: number } = {}) {
  const query = new URLSearchParams()
  if (filters.airport) query.set('airport', filters.airport)
  if (filters.month) query.set('month', filters.month)
  if (filters.search) query.set('search', filters.search)
  if (filters.level) query.set('level', filters.level)
  if (filters.source) query.set('source', filters.source)
  if (filters.page) query.set('page', String(filters.page))
  if (filters.page_size) query.set('page_size', String(filters.page_size))
  if (filters.mine) query.set('mine', 'true')
  return readPage<Forecast>(`/api/traffic/forecasts/${query.size ? `?${query}` : ''}`)
}

export type FlightFilters = { origin?: string; destination?: string; airline?: string; search?: string; upcoming?: boolean; airport?: string; date?: string; mine?: boolean; page?: number; page_size?: number; departure_date?: string; departure_hour_from?: string; departure_hour_to?: string; arrival_date?: string; arrival_hour_from?: string; arrival_hour_to?: string }
export function loadFlights(filters: FlightFilters = {}) {
  const query = new URLSearchParams()
  for (const field of ['departure_date', 'departure_hour_from', 'departure_hour_to', 'arrival_date', 'arrival_hour_from', 'arrival_hour_to'] as const) {
    if (filters[field] !== undefined && filters[field] !== '') query.set(field, filters[field]!)
  }
  if (filters.origin) query.set('origin', filters.origin)
  if (filters.destination) query.set('destination', filters.destination)
  if (filters.airline) query.set('airline', filters.airline)
  if (filters.search) query.set('search', filters.search)
  if (filters.upcoming) query.set('upcoming', 'true')
  if (filters.airport) query.set('airport', filters.airport)
  if (filters.date) query.set('date', filters.date)
  if (filters.page) query.set('page', String(filters.page))
  if (filters.page_size) query.set('page_size', String(filters.page_size))
  if (filters.mine) query.set('mine', 'true')
  return readPage<Flight>(`/api/flights/${query.size ? `?${query}` : ''}`)
}

export type RouteDate = { date: string; flight_count: number; open_seats: number }
export async function loadRouteDates(origin: string, destination: string, month: string) {
  return (await apiRequest<{ dates: RouteDate[] }>(`/api/flights/route-dates/?${new URLSearchParams({ origin, destination, month })}`)).dates
}
