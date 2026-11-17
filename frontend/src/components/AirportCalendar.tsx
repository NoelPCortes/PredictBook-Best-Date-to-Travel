import { useCallback, useId, useState } from 'react'
import type { ReactNode } from 'react'
import type { Forecast } from '../types/traffic'
import { loadAirports } from '../api/lookups'
import { loadFlights, loadForecasts } from '../api/traffic'
import RecordField from './RecordField'
import RecordAlert from './RecordAlert'
import CrowdChip from './CrowdChip'
import { formatFlightTime } from './flightTime'
import { calendarDate, calendarDateLabel, changeMonth, monthDates, monthLabel, projectToday } from './calendarDates'
import { useRemoteResource } from './useRemoteResource'
import previousIcon from '../assets/icons/chevron-leftIcon.png'
import nextIcon from '../assets/icons/chevron-rightIcon.png'
import clockIcon from '../assets/icons/ClockIcon.png'
import seatIcon from '../assets/icons/SeatIcon.png'
import './AirportCalendar.css'

export type CalendarSelection = { airport: string; date: string; forecast?: Forecast; onSelectDate: (date: string) => void }
type CalendarOptions = { renderDetails?: (selection: CalendarSelection) => ReactNode; renderAfter?: (selection: CalendarSelection) => ReactNode; showFlightDirections?: boolean }

function AirportMonth({ airport, renderDetails, renderAfter, showFlightDirections }: { airport: string } & CalendarOptions) {
  const today = projectToday()
  const [selectedDate, setSelectedDate] = useState(today)
  const month = selectedDate.slice(0, 7)
  const [forecastAttempt, setForecastAttempt] = useState(0)
  const [flightAttempt, setFlightAttempt] = useState(0)
  const fetchForecasts = useCallback(() => loadForecasts({ airport, month }), [airport, month])
  const fetchFlights = useCallback(() => loadFlights({ airport, date: selectedDate }), [airport, selectedDate])
  const forecasts = useRemoteResource(`${airport}/${month}/${forecastAttempt}`, fetchForecasts)
  const flights = useRemoteResource(`${airport}/${selectedDate}/${flightAttempt}`, fetchFlights)
  const headingId = useId()
  const selectedForecast = forecasts.value?.find(record => record.date === selectedDate)
  const days = monthDates(month)
  const firstWeekday = calendarDate(days[0]!).getUTCDay()
  return <><div className="airport-calendar-layout">
    <section className="airport-calendar-month" aria-labelledby={headingId}>
      <div className="airport-calendar-heading">
        <h2 id={headingId}>{monthLabel(month)}</h2>
        <button type="button" className="calendar-month-button" aria-label="Previous month" onClick={() => setSelectedDate(`${changeMonth(month, -1)}-01`)}><img src={previousIcon} alt="" /></button>
        <button type="button" className="calendar-month-button" aria-label="Next month" onClick={() => setSelectedDate(`${changeMonth(month, 1)}-01`)}><img src={nextIcon} alt="" /></button>
      </div>
      {!forecasts.value && !forecasts.error && <p role="status">Loading crowd forecasts…</p>}
      {forecasts.error && <><RecordAlert kind="error">Unable to load crowd forecasts. Please try again.</RecordAlert><button type="button" className="calendar-text-button" onClick={() => setForecastAttempt(value => value + 1)}>Retry forecasts</button></>}
      <div className="calendar-grid airport-day-grid" role="group" aria-label={`${monthLabel(month)} crowd levels`} aria-busy={!forecasts.value && !forecasts.error}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span className="weekday" key={day}>{day}</span>)}
        {Array.from({ length: firstWeekday }, (_, index) => <span aria-hidden="true" key={`blank-${index}`} />)}
        {days.map(date => {
          const forecast = forecasts.value?.find(record => record.date === date)
          const level = forecast?.crowd_level
          const levelText = level ? `${level[0]!.toUpperCase()}${level.slice(1)} crowd` : forecasts.error ? 'Forecast unavailable' : forecasts.value ? 'No data' : 'Loading crowd forecast'
          return <button type="button" key={date} className={`calendar-day ${level ?? 'no-data'}`} aria-label={`${calendarDateLabel(date)}, ${levelText}`} aria-pressed={selectedDate === date} aria-current={date === today ? 'date' : undefined} onClick={() => setSelectedDate(date)}>{Number(date.slice(-2))}</button>
        })}
      </div>
      <div className="legend">{(['low', 'medium', 'high'] as const).map(level => <span key={level}><i className={level} aria-hidden="true" />{level[0]!.toUpperCase() + level.slice(1)}</span>)}<span><i className="no-data" aria-hidden="true" />No data</span></div>
    </section>
    <section className="airport-date-details" aria-live="polite" aria-atomic="true" aria-label="Selected date details">
      <h3>{calendarDateLabel(selectedDate)}</h3>
      {forecasts.value ? <CrowdChip level={selectedForecast?.crowd_level} /> : <p>{forecasts.error ? 'Crowd forecast unavailable.' : 'Loading crowd forecast…'}</p>}
      <p>Forecast dates: UTC. Flights include arrivals and departures.</p>
      <p>Flight times: Philippine time (Asia/Manila, UTC+08:00).</p>
      {renderDetails?.({ airport, date: selectedDate, forecast: selectedForecast, onSelectDate: setSelectedDate })}
      {!flights.value && !flights.error && <p role="status">Loading flights…</p>}
      {flights.error && <><RecordAlert kind="error">Unable to load flights. Please try again.</RecordAlert><button type="button" className="calendar-text-button" onClick={() => setFlightAttempt(value => value + 1)}>Retry flights</button></>}
      {flights.value?.length === 0 && <p>No flights listed for this date.</p>}
      {flights.value && flights.value.length > 0 && <ul className="calendar-flight-list">{flights.value.map(flight => <li key={flight.id}>
        <h4>{flight.airline_name} ({flight.airline_code}) · {flight.flight_number}</h4>
        {showFlightDirections && flight.direction && <p><strong>{flight.direction === 'departing' ? 'Departing' : 'Arriving'}</strong></p>}
        <p>{flight.origin_code} — {flight.origin_name} → {flight.destination_code} — {flight.destination_name}</p>
        <p><img src={clockIcon} alt="" /><span>Departure: <time dateTime={flight.departure_time}>{formatFlightTime(flight.departure_time)}</time><br />Arrival: <time dateTime={flight.arrival_time}>{formatFlightTime(flight.arrival_time)}</time></span></p>
        <p><img src={seatIcon} alt="" />{flight.available_seats} open seats / {flight.total_seats} total seats</p>
      </li>)}</ul>}
    </section>
  </div>{renderAfter?.({ airport, date: selectedDate, forecast: selectedForecast, onSelectDate: setSelectedDate })}</>
}

export default function AirportCalendar(options: CalendarOptions) {
  const [airportId, setAirportId] = useState('')
  const [attempt, setAttempt] = useState(0)
  const airports = useRemoteResource(`airports/${attempt}`, loadAirports)
  const selectedAirport = airportId || String(airports.value?.[0]?.id ?? '')
  return <section className="airport-calendar" aria-label="Airport traffic calendar">
    {!airports.value && !airports.error && <p role="status">Loading airports…</p>}
    {airports.error && <><RecordAlert kind="error">Unable to load airports. Please try again.</RecordAlert><button type="button" className="calendar-text-button" onClick={() => setAttempt(value => value + 1)}>Retry airports</button></>}
    {airports.value && <>
      <RecordField name="calendar-airport" label="Airport" value={selectedAirport} onChange={setAirportId} options={airports.value.map(airport => ({ value: String(airport.id), label: `${airport.code} — ${airport.name}` }))} />
      {selectedAirport ? <AirportMonth airport={selectedAirport} {...options} /> : <p>No airports available.</p>}
    </>}
  </section>
}
