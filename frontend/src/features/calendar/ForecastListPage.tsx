import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, fieldMessage } from '../../api/client'
import RecordLayout from '../../components/RecordLayout'
import RecordAlert from '../../components/RecordAlert'
import RecordField from '../../components/RecordField'
import DeleteConfirmation from '../../components/DeleteConfirmation'
import PageControls from '../../components/PageControls'
import CrowdChip from '../../components/CrowdChip'
import { useRemoteResource } from '../../components/useRemoteResource'
import type { Forecast } from '../../types/traffic'
import type { Airport } from '../../types/flights'
import { deleteForecast, loadForecastList, loadForecastAirports } from './api'
import './CalendarInsights.css'

function ForecastRecords({ airport, globalSearch, airports, onSuccess }: { airport: string; globalSearch: string; airports: Airport[]; onSuccess: (message: string) => void }) {
  const [filters, setFilters] = useState({ search: '', month: '', level: '', source: '' })
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const query = useMemo(() => globalSearch ? { search: globalSearch, page } : { airport, ...Object.fromEntries(Object.entries(filters).filter(([,value]) => value)), page }, [airport, globalSearch, filters, page])
  const load = useCallback(() => loadForecastList(query), [query])
  const result = useRemoteResource(`forecast-results/${JSON.stringify(query)}/${attempt}`, load)
  const [pending, setPending] = useState<Forecast | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [removed, setRemoved] = useState<number[]>([])
  const airportName = (id: number) => { const record = airports.find(item => item.id === id); return record ? `${record.code} — ${record.name}` : String(id) }
  async function remove() {
    if (!pending || deleting) return
    setDeleting(true); setError('')
    try { await deleteForecast(pending.id); setRemoved(previous => [...previous,pending.id]); setPending(null); onSuccess('Forecast deleted.') }
    catch (error) { setError(error instanceof ApiError ? fieldMessage(error.fields.detail) ?? 'Unable to delete the forecast. Please try again.' : 'Unable to delete the forecast. Please try again.') }
    finally { setDeleting(false) }
  }
  function change(name: keyof typeof filters, value: string) { setFilters(previous => ({ ...previous, [name]: value })); setPage(1) }
  return <>
    {!globalSearch && <>
      <header className="record-heading"><h2>{airportName(Number(airport))}</h2><Link className="record-button" to="/staff/forecasts/new">Add forecast</Link></header>
      <div className="record-fields">
        <RecordField name="airport-forecast-search" label="Search this airport's forecasts" value={filters.search} onChange={value => change('search',value)} />
        <RecordField name="forecast-month" label="Month" type="month" value={filters.month} onChange={value => change('month',value)} />
        <RecordField name="forecast-level" label="Crowd level" value={filters.level} onChange={value => change('level',value)} options={[{value:'',label:'All levels'},...['low','medium','high'].map(level => ({value:level,label:level[0]!.toUpperCase()+level.slice(1)}))]} />
        <RecordField name="forecast-source" label="Source" value={filters.source} onChange={value => change('source',value)} options={[{value:'',label:'All sources'},{value:'calculated',label:'Calculated'},{value:'manual',label:'Manual'}]} />
      </div>
    </>}
    {pending && <DeleteConfirmation key={pending.id} message={`Delete forecast for ${airportName(pending.airport)} on ${pending.date}? This cannot be undone.`} isDeleting={deleting} error={error} onCancel={() => {setPending(null);setError('')}} onDelete={() => { void remove() }} />}
    {!result.value && !result.error && <p role="status">Loading forecasts...</p>}
    {result.error && <><RecordAlert kind="error">{`Unable to load forecasts. ${result.error}`}</RecordAlert><button className="record-button record-secondary" onClick={() => setAttempt(value => value + 1)}>Try again</button></>}
    {result.value && <>
      <div className="record-table-scroll" tabIndex={0} role="region" aria-label="Forecasts table"><table className="record-table">
        <thead><tr>{['Airport','Date','Crowd level','Seats booked','Flights','Source','Actions'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{result.value.filter(record => !removed.includes(record.id)).map(record => <tr key={record.id}>
          <td>{airportName(record.airport)}</td><td><time dateTime={record.date}>{record.date}</time></td><td><CrowdChip level={record.crowd_level} /></td>
          <td>{!record.flight_count ? 'No flight data' : `${record.seats_booked} of ${record.seats_total} seats, ${record.seats_total ? (record.seats_booked / record.seats_total * 100).toFixed(1) : '0.0'}%`}</td>
          <td>{record.flight_count} <Link className="record-button record-secondary" to={`/staff/flights?airport=${record.airport}&date=${record.date}`}>View flights</Link></td>
          <td>{record.is_calculated ? 'Calculated automatically' : 'Staff entry'}</td>
          <td>{record.can_edit && !record.is_calculated && <div className="record-actions"><Link className="record-button record-secondary" to={`/staff/forecasts/${record.id}/edit`}>Edit</Link><button type="button" className="record-button record-danger" disabled={deleting} onClick={() => {setPending(record);setError('')}}>Delete</button></div>}</td>
        </tr>)}{!result.value.some(record => !removed.includes(record.id)) && <tr><td colSpan={7}>No forecasts listed yet.</td></tr>}</tbody>
      </table></div>
      <PageControls rows={result.value} page={page} onChange={setPage} />
    </>}
  </>
}

export default function ForecastListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [success,setSuccess] = useState(() => typeof location.state?.success === 'string' ? location.state.success as string : '')
  const [search,setSearch] = useState('')
  const [airport,setAirport] = useState('')
  const [attempt,setAttempt] = useState(0)
  const airports = useRemoteResource(`forecast-airports/${attempt}`,loadForecastAirports)
  useEffect(() => { if (location.state?.success) navigate(location.pathname,{replace:true,state:null}) },[location.pathname,location.state,navigate])
  return <RecordLayout>
    <h1 tabIndex={-1}>Crowd forecasts</h1>
    {success && <RecordAlert kind="success">{success}</RecordAlert>}
    <RecordField name="global-forecast-search" label="Search all forecasts" placeholder="Search airport or date" value={search} onChange={setSearch} />
    {search.trim() && <button type="button" className="record-button record-ghost" onClick={() => {setSearch('');setAirport('')}}>Clear search</button>}
    {!airports.value && !airports.error && <p role="status">Loading airports...</p>}
    {airports.error && <><RecordAlert kind="error">{airports.error}</RecordAlert><button className="record-button record-secondary" onClick={() => setAttempt(value => value + 1)}>Try again</button></>}
    {airports.value && (search.trim() || airport ? <>
      {!search.trim() && <button type="button" className="record-button record-ghost" onClick={() => setAirport('')}>Back to airports</button>}
      <ForecastRecords key={`${airport}/${search.trim()}`} airport={airport} globalSearch={search.trim()} airports={airports.value} onSuccess={setSuccess} />
    </> : <section aria-label="Airports"><h2>Airports</h2><ul className="forecast-airport-list">{airports.value.map(record => <li key={record.id}><button type="button" className="record-button record-secondary" onClick={() => setAirport(String(record.id))}><strong>{record.code} — {record.name}</strong><span>{record.city}, {record.country}</span><span>{record.forecast_count ?? 0} forecasts</span></button></li>)}</ul>{!airports.value.length && <p>No airports available.</p>}</section>)}
  </RecordLayout>
}
