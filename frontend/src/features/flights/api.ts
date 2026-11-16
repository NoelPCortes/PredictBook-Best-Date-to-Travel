import { apiRequest } from '../../api/client'
import type { Flight } from '../../types/flights'

export function listFlights() {
  return apiRequest<Flight[]>('/api/flights/')
}
