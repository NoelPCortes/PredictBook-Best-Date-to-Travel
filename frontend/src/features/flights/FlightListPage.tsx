import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import RecordLayout from '../../components/RecordLayout'
import RecordAlert from '../../components/RecordAlert'
import DeleteConfirmation from '../../components/DeleteConfirmation'
import { ApiError, fieldMessage } from '../../api/client'
import { formatFlightTime } from '../../components/flightTime'
import type { Flight } from '../../types/flights'
import { deleteFlight, listFlights } from './api'

function FlightList() {
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const airport = query.get('airport') ?? ''
  const date = query.get('date') ?? ''
  const navigate = useNavigate()
  const [success, setSuccess] = useState(() => typeof location.state?.success === 'string' ? location.state.success as string : '')
  const [pendingDelete, setPendingDelete] = useState<Flight | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [flights, setFlights] = useState<Flight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (location.state?.success) navigate(location.pathname + location.search, { replace: true, state: null })
  }, [location.pathname, location.search, location.state, navigate])
  useEffect(() => {
    let isActive = true
    void listFlights({ airport, date }).then(records => { if (isActive) setFlights(records) })
      .catch(() => { if (isActive) setError('Unable to load flights. Please try again.') })
      .finally(() => { if (isActive) setIsLoading(false) })
    return () => { isActive = false }
  }, [attempt, airport, date])
  async function confirmDelete() {
    if (!pendingDelete || isDeleting) return
    setIsDeleting(true); setDeleteError(''); setSuccess('')
    try {
      await deleteFlight(pendingDelete.id)
      setFlights(previous => previous.filter(flight => flight.id !== pendingDelete.id))
      setPendingDelete(null); setSuccess('Flight deleted.')
    } catch (error) {
      setDeleteError(error instanceof ApiError ? fieldMessage(error.fields.detail) ?? 'Unable to delete the flight. Please try again.' : 'Unable to delete the flight. Please try again.')
    } finally { setIsDeleting(false) }
  }
  return <RecordLayout>
    <header className="record-heading"><h1 tabIndex={-1}>Flights</h1><Link className="record-button" to="/staff/flights/new">Add flight</Link></header>
    <p>Flight times are shown in Philippine time (Asia/Manila, UTC+08:00).</p>
    {(airport || date) && <p className="record-filter" role="status">Flights {airport ? `involving airport ${airport}` : ''}{date ? ` on ${date}` : ''} (forecast dates: UTC). <Link className="record-button record-ghost" to="/staff/flights">Clear filter</Link></p>}
    {success && <RecordAlert kind="success">{success}</RecordAlert>}
    {pendingDelete && <DeleteConfirmation key={pendingDelete.id} message={`Delete flight ${pendingDelete.airline_code} ${pendingDelete.flight_number}? This cannot be undone.`} isDeleting={isDeleting} error={deleteError} onCancel={() => { setPendingDelete(null); setDeleteError('') }} onDelete={() => { void confirmDelete() }} />}
    {isLoading && <p role="status">Loading flights…</p>}
    {error && <><RecordAlert kind="error">{error}</RecordAlert><button className="record-button record-secondary" onClick={() => { setIsLoading(true); setError(''); setAttempt(value => value + 1) }}>Try again</button></>}
    {!isLoading && !error && <div className="record-table-scroll" tabIndex={0} role="region" aria-label="Flights table">
      <table className="record-table"><thead><tr>
        {['Airline', 'Flight number', 'Route', 'Departure', 'Arrival', 'Open seats / total seats', 'Created by', 'Actions'].map(label => <th scope="col" key={label}>{label}</th>)}
      </tr></thead><tbody>
        {flights.map(flight => <tr key={flight.id}>
          <td>{flight.airline_name} ({flight.airline_code})</td><td>{flight.flight_number}</td>
          <td>{flight.origin_code} → {flight.destination_code}</td>
          <td><time dateTime={flight.departure_time}>{formatFlightTime(flight.departure_time)}</time></td>
          <td><time dateTime={flight.arrival_time}>{formatFlightTime(flight.arrival_time)}</time></td>
          <td>{flight.available_seats} / {flight.total_seats}</td><td>{flight.created_by_username}</td>
          <td>{flight.can_edit && <div className="record-actions"><Link className="record-button record-secondary" to={`/staff/flights/${flight.id}/edit`}>Edit</Link><button type="button" className="record-button record-danger" disabled={isDeleting} onClick={() => { setDeleteError(''); setPendingDelete(flight) }}>Delete</button></div>}</td>
        </tr>)}
        {!flights.length && <tr><td colSpan={8}>No flights listed yet.</td></tr>}
      </tbody></table>
    </div>}
  </RecordLayout>
}

export default function FlightListPage() {
  const location = useLocation()
  return <FlightList key={location.search} />
}
