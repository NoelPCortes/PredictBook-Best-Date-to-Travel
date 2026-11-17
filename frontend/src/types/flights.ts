export type Airport = { id: number; code: string; name: string; city: string; country: string; forecast_count?: number }
export type Airline = { id: number; code: string; name: string }
export type Flight = {
  id: number
  airline: number
  airline_name: string
  airline_code: string
  flight_number: string
  origin: number
  origin_code: string
  origin_name: string
  destination: number
  destination_code: string
  destination_name: string
  departure_time: string
  arrival_time: string
  total_seats: number
  available_seats: number
  created_by_username?: string
  can_edit?: boolean
  direction?: 'departing' | 'arriving'
}
