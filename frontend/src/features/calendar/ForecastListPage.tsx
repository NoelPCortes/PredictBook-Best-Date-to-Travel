import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, fieldMessage } from '../../api/client'
import RecordLayout from '../../components/RecordLayout'
import RecordAlert from '../../components/RecordAlert'
import DeleteConfirmation from '../../components/DeleteConfirmation'
import CrowdChip from '../../components/CrowdChip'
import PageControls from '../../components/PageControls'
import type { Records } from '../../api/pagination'
import type { Forecast } from '../../types/traffic'
import type { Airport } from '../../types/flights'
import { deleteForecast, loadForecastList } from './api'

export default function ForecastListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [success, setSuccess] = useState(() => typeof location.state?.success === 'string' ? location.state.success as string : '')
  const [forecasts, setForecasts] = useState<Records<Forecast>>([])
  const [airports, setAirports] = useState<Airport[]>([])
  const [pendingDelete, setPendingDelete] = useState<Forecast | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { if (location.state?.success) navigate(location.pathname, { replace: true, state: null }) }, [location.pathname, location.state, navigate])
  useEffect(() => {
    let isActive = true
    void loadForecastList(page).then(([records, options]) => { if (isActive) { setForecasts(records); setAirports(options) } })
      .catch(() => { if (isActive) setError('Unable to load forecasts. Please try again.') })
      .finally(() => { if (isActive) setIsLoading(false) })
    return () => { isActive = false }
  }, [attempt, page])
  const airportName = (id: number) => {
    const airport = airports.find(item => item.id === id)
    return airport ? `${airport.code} — ${airport.name}` : String(id)
  }
  async function confirmDelete() {
    if (!pendingDelete || isDeleting) return
    setIsDeleting(true); setDeleteError(''); setSuccess('')
    try {
      await deleteForecast(pendingDelete.id)
      setForecasts(previous => previous.filter(record => record.id !== pendingDelete.id))
      setPendingDelete(null); setSuccess('Forecast deleted.')
    } catch (error) {
      setDeleteError(error instanceof ApiError ? fieldMessage(error.fields.detail) ?? 'Unable to delete the forecast. Please try again.' : 'Unable to delete the forecast. Please try again.')
    } finally { setIsDeleting(false) }
  }
  return <RecordLayout>
    <header className="record-heading"><h1 tabIndex={-1}>Crowd forecasts</h1><Link className="record-button" to="/staff/forecasts/new">Add forecast</Link></header>
    {success && <RecordAlert kind="success">{success}</RecordAlert>}
    {pendingDelete && <DeleteConfirmation key={pendingDelete.id} message={`Delete forecast for ${airportName(pendingDelete.airport)} on ${pendingDelete.date}? This cannot be undone.`} isDeleting={isDeleting} error={deleteError} onCancel={() => { setPendingDelete(null); setDeleteError('') }} onDelete={() => { void confirmDelete() }} />}
    {isLoading && <p role="status">Loading forecasts…</p>}
    {error && <><RecordAlert kind="error">{error}</RecordAlert><button className="record-button record-secondary" onClick={() => { setIsLoading(true); setError(''); setAttempt(value => value + 1) }}>Try again</button></>}
    {!isLoading && !error && <div className="record-table-scroll" tabIndex={0} role="region" aria-label="Forecasts table"><table className="record-table">
      <thead><tr>{['Airport', 'Date', 'Crowd level', 'Seats booked', 'Flights', 'Source', 'Actions'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{forecasts.map(record => <tr key={record.id}>
        <td>{airportName(record.airport)}</td><td><time dateTime={record.date}>{record.date}</time></td><td><CrowdChip level={record.crowd_level} /></td>
        <td>{record.seats_booked} of {record.seats_total} seats, {record.seats_total ? `${(record.seats_booked / record.seats_total * 100).toFixed(1)}%` : 'no seat data'}</td>
        <td>{record.flight_count} <Link className="record-button record-secondary" to={`/staff/flights?airport=${record.airport}&date=${record.date}`}>View flights</Link></td>
        <td>{record.is_calculated ? 'Calculated automatically' : 'Staff entry'}</td>
        <td>{record.can_edit && !record.is_calculated && <div className="record-actions"><Link className="record-button record-secondary" to={`/staff/forecasts/${record.id}/edit`}>Edit</Link><button type="button" className="record-button record-danger" disabled={isDeleting} onClick={() => { setDeleteError(''); setPendingDelete(record) }}>Delete</button></div>}</td>
      </tr>)}{!forecasts.length && <tr><td colSpan={7}>No forecasts listed yet.</td></tr>}</tbody>
    </table></div>}
    {!isLoading && !error && <PageControls rows={forecasts} page={page} onChange={value => { setPage(value); setIsLoading(true) }} />}
  </RecordLayout>
}
