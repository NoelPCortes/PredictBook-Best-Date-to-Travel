import type { Flight } from '../types/flights'
import { formatFlightTime } from './flightTime'
import clockIcon from '../assets/icons/ClockIcon.png'
import seatIcon from '../assets/icons/SeatIcon.png'

export default function FlightCards({ flights }: { flights: Flight[] }) {
  return <ul className="calendar-flight-list">{flights.map(flight => <li key={flight.id}>
    <h3>{flight.airline_name} ({flight.airline_code}) · {flight.flight_number}</h3>
    <p>{flight.origin_code} to {flight.destination_code}</p>
    <p><img src={clockIcon} alt="" /><time dateTime={flight.departure_time}>{formatFlightTime(flight.departure_time)}</time></p>
    <p><img src={seatIcon} alt="" />{flight.available_seats} open seats</p>
  </li>)}</ul>
}
