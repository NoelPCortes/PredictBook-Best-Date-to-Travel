import type { FlightFilters } from '../../api/traffic'

export type OptionalFilters = Pick<FlightFilters, 'departure_date' | 'departure_hour_from' | 'departure_hour_to' | 'arrival_date' | 'arrival_hour_from' | 'arrival_hour_to'>
export function optionalFilterErrors(filters: OptionalFilters) {
  const errors: Record<string, string> = {}
  for (const prefix of ['departure', 'arrival'] as const) {
    const from = filters[`${prefix}_hour_from`]
    const to = filters[`${prefix}_hour_to`]
    if (from && to && Number(to) < Number(from)) errors[`${prefix}_hour_to`] = 'The ending hour cannot be earlier than the starting hour.'
  }
  if (filters.departure_date && filters.arrival_date && filters.arrival_date < filters.departure_date) errors.arrival_date = 'Arrival date cannot be before the departure date.'
  return errors
}
