import type { Airport, Airline } from '../types/flights'
export const airportOptions = (airports: Airport[]) => airports.map(airport => ({ value: String(airport.id), label: `${airport.code} — ${airport.name}`, searchText: `${airport.city} ${airport.country}` }))
export const airlineOptions = (airlines: Airline[]) => airlines.map(airline => ({ value: String(airline.id), label: `${airline.name} (${airline.code})` }))
