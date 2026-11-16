import { apiRequest } from '../../api/client'
import type { Flight } from '../../types/flights'
import { loadAirlines, loadAirports } from '../../api/lookups'

export type FlightInput = {
  airline: string; flight_number: string; origin: string; destination: string
  departure_time: string; arrival_time: string; total_seats: string; available_seats: string
}

export function listFlights() {
  return apiRequest<Flight[]>('/api/flights/')
}

export function loadFlightOptions() {
  return Promise.all([loadAirports(), loadAirlines()])
}

export function getFlight(id: string) {
  return apiRequest<Flight>(`/api/flights/${id}/`)
}

export function createFlight(values: FlightInput) {
  return apiRequest<Flight>('/api/flights/', { method: 'POST', body: JSON.stringify(values) })
}

export function updateFlight(id: string, values: FlightInput) {
  return apiRequest<Flight>(`/api/flights/${id}/`, { method: 'PATCH', body: JSON.stringify(values) })
}

export function deleteFlight(id: number) {
  return apiRequest<void>(`/api/flights/${id}/`, { method: 'DELETE' })
}
