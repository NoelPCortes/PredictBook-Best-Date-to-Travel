import { readLookup } from './pagination'
import type { Airline, Airport } from '../types/flights'

export function loadAirports() {
  return readLookup<Airport>('/api/flights/airports/')
}

export function loadAirlines() {
  return readLookup<Airline>('/api/flights/airlines/')
}
