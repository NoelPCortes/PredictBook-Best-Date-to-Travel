import { apiRequest } from './client'
import type { Airline, Airport } from '../types/flights'

export function loadAirports() {
  return apiRequest<Airport[]>('/api/flights/airports/')
}

export function loadAirlines() {
  return apiRequest<Airline[]>('/api/flights/airlines/')
}
