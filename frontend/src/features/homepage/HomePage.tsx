import { useAuth } from '../../api/authState'
import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { loadAirports } from '../../api/lookups'
import { useRemoteResource } from '../../components/useRemoteResource'
import RecordField from '../../components/RecordField'
import RecordAlert from '../../components/RecordAlert'
import { airportOptions } from '../../components/lookupOptions'
import { formatFlightTime } from '../../components/flightTime'
import { useSignOut } from '../../components/useSignOut'
import AppNavbar from '../../components/AppNavbar'
import HomeCalendar from '../../components/HomeCalendar'
import { readRecentRoutes, saveRecentRoute, clearRecentRoutes } from '../../api/recentRoutes'
import type { RecentRoute } from '../../api/recentRoutes'
import { upcomingBooking } from './api'
import RouteResults from './RouteResults'
import OptionalFlightFilters from './OptionalFlightFilters'
import { optionalFilterErrors } from './searchFilters'
import type { OptionalFilters } from './searchFilters'
import '../../components/RecordManagement.css'
import './HomePage.css'

function HomeContent({ userId }: { userId: number }) {
  const [optional, setOptional] = useState<OptionalFilters>({})
  const [applied, setApplied] = useState<OptionalFilters>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [recent, setRecent] = useState(() => readRecentRoutes(userId))
  const [active, setActive] = useState<RecentRoute>()
  const [run, setRun] = useState(0)
  const [error, setError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const airports = useRemoteResource(`home-airports/${attempt}`, loadAirports)
  const recentKey = JSON.stringify(recent)
  const loadBooking = useCallback(() => upcomingBooking(recent), [recent])
  const booking = useRemoteResource(`upcoming-route/${userId}/${recentKey}/${attempt}`, loadBooking)
  const code = (id: string) => airports.value?.find(airport => String(airport.id) === id)?.code ?? id
  const label = (route: RecentRoute) => `${code(route.origin)} to ${code(route.destination)}`
  function search(route: RecentRoute, filters: OptionalFilters = {}) {
    setOptional(filters); setApplied(filters); setFieldErrors({})
    setOrigin(route.origin); setDestination(route.destination); setActive(route); setRun(value => value + 1); setError('')
    try { setRecent(saveRecentRoute(userId, route)); setStorageError('') }
    catch { setStorageError('Unable to save recent searches in this browser.') }
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!origin || !destination || origin === destination) { setError(!origin || !destination ? 'Choose From and To airports.' : 'From and To must be different airports.'); return }
    const errors = optionalFilterErrors(optional)
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      document.querySelector<HTMLElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus()
      return
    }
    search({ origin, destination }, optional)
  }
  return <>
    <section className="summary-card home-search-card" aria-label="Search flights">
      <form onSubmit={submit} className="home-route-search" noValidate>
        <RecordField searchable name="home-origin" label="From" value={origin} onChange={setOrigin} options={airportOptions(airports.value ?? [])} error={error && !origin ? error : undefined} />
        <RecordField searchable name="home-destination" label="To" value={destination} onChange={setDestination} options={airportOptions(airports.value ?? [])} error={error && destination === origin ? error : undefined} />
        <OptionalFlightFilters value={optional} onChange={setOptional} errors={fieldErrors} />
        {Object.values(optional).some(Boolean) && <button className="record-button record-ghost" type="button" onClick={() => { setOptional({}); setFieldErrors({}) }}>Clear optional filters</button>}
        <button className="record-button" type="submit" disabled={!airports.value}>Search flights</button>
      </form>
      {error && <RecordAlert kind="error">{error}</RecordAlert>}
      {!airports.value && !airports.error && <p role="status">Loading airports...</p>}
      {airports.error && <><RecordAlert kind="error">{airports.error}</RecordAlert><button className="record-button record-secondary" onClick={() => setAttempt(value => value + 1)}>Retry airports</button></>}
      {storageError && <RecordAlert kind="error">{storageError}</RecordAlert>}
    </section>
    <div className="home-summary">
      <section className="summary-card" aria-labelledby="upcoming-title"><h2 id="upcoming-title">Your upcoming booking</h2><p>A route search, not a stored booking.</p>
        {!booking.value && booking.value !== null && !booking.error && <p role="status">Checking upcoming flights...</p>}
        {booking.error && <><RecordAlert kind="error">{booking.error}</RecordAlert><button className="record-button record-secondary" onClick={() => setAttempt(value => value + 1)}>Retry upcoming booking</button></>}
        {booking.value === null && <p>No upcoming booking yet. Search flights to get started.</p>}
        {booking.value && <><button className="record-button record-secondary" onClick={() => search(booking.value!.route)}>{label(booking.value.route)}</button><p>{booking.value.count} upcoming flights</p><ol>{booking.value.flights.slice(0,3).map(flight => <li key={flight.id}><time dateTime={flight.departure_time}>{formatFlightTime(flight.departure_time)}</time></li>)}</ol></>}
      </section>
      <section className="summary-card" aria-labelledby="recent-title"><h2 id="recent-title">Recent searches</h2>
        <button className="record-button record-ghost" onClick={() => { try { clearRecentRoutes(userId); setRecent([]) } catch { setStorageError('Unable to clear recent searches in this browser.') } }}>Clear</button>
        {!recent.length && <p>No recent searches yet.</p>}
        <ul className="home-recent-routes">{recent.map(route => <li key={`${route.origin}/${route.destination}`}><button className="record-button record-secondary" onClick={() => search(route)}>{label(route)}</button></li>)}</ul>
      </section>
    </div>
    {active && <RouteResults key={`${active.origin}/${active.destination}/${run}`} route={active} label={label(active)} filters={applied} />}
    <HomeCalendar route={active ? { ...active, originCode: code(active.origin), destinationCode: code(active.destination) } : undefined} onClearRoute={() => setActive(undefined)} />
  </>
}

export default function HomePage() {
  const { profile } = useAuth()
  const { signOut, isSigningOut } = useSignOut()
  return <>
    <AppNavbar userName={profile?.username ?? ''} onSignOut={signOut} isSigningOut={isSigningOut} />
    <main className="home-page record-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-intro">
          <p className="eyebrow">WELCOME BACK, {profile?.username.toUpperCase()}</p>
          <h1 id="home-title">Check airport crowds and flights</h1>
          <p>See airport crowd levels and flight information by date.</p>
        </div>
      </section>
      {profile && <HomeContent key={profile.id} userId={profile.id} />}
    </main>
  </>
}
