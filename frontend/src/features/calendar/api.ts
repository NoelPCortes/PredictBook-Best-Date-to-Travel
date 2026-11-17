import { apiRequest } from '../../api/client'
import { loadAirports } from '../../api/lookups'
import { loadForecasts } from '../../api/traffic'
import type { Forecast, CrowdLevel } from '../../types/traffic'
import type { DateExplanation } from './types'

export type ForecastInput = { airport: string; date: string; crowd_level: CrowdLevel | ''; crowd_score: string | null; data_source: string }

export function loadForecastList() { return Promise.all([loadForecasts(), loadAirports()]) }
export function loadForecastAirports() { return loadAirports() }
export function getForecast(id: string) { return apiRequest<Forecast>(`/api/traffic/forecasts/${id}/`) }
export function createForecast(values: ForecastInput) { return apiRequest<Forecast>('/api/traffic/forecasts/', { method: 'POST', body: JSON.stringify(values) }) }
export function updateForecast(id: string, values: ForecastInput) { return apiRequest<Forecast>(`/api/traffic/forecasts/${id}/`, { method: 'PATCH', body: JSON.stringify(values) }) }
export function deleteForecast(id: number) { return apiRequest<void>(`/api/traffic/forecasts/${id}/`, { method: 'DELETE' }) }
export function loadDateExplanation(airport: string, date: string) {
  return apiRequest<DateExplanation>(`/api/traffic/explanation/?${new URLSearchParams({ airport, date })}`)
}
