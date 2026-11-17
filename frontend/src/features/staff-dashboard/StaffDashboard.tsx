import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../api/authState'
import { ApiError } from '../../api/client'
import { loadAirports } from '../../api/lookups'
import AppNavbar from '../../components/AppNavbar'
import RecordField from '../../components/RecordField'
import RecordAlert from '../../components/RecordAlert'
import { useRemoteResource } from '../../components/useRemoteResource'
import { useSignOut } from '../../components/useSignOut'
import { calendarDate, calendarDateLabel } from '../../components/calendarDates'
import { getDashboardAccess, getDashboardSummary } from './api'
import OwnRecordsCard from './OwnRecordsCard'
import ComparisonCard from './ComparisonCard'
import '../../components/RecordManagement.css'
import './StaffDashboard.css'

const LEVELS = ['high', 'medium', 'low'] as const
const LABELS = { high: 'High', medium: 'Medium', low: 'Low' }

function DashboardContent() {
  const [airport, setAirport] = useState('')
  const [attempt, setAttempt] = useState(0)
  const airports = useRemoteResource(`dashboard-airports/${attempt}`, loadAirports)
  const fetchSummary = useCallback(() => getDashboardSummary(airport || undefined), [airport])
  const summary = useRemoteResource(`summary/${airport}/${attempt}`, fetchSummary)
  const result = summary.value
  const selectedAirport = airport || String(result?.airport?.id ?? '')
  const isLoading = !result && !summary.error
  return <>
    <header className="staff-heading">
      <div><p className="eyebrow">STAFF DASHBOARD</p><h1>Crowd overview</h1><p>Expected airport crowd levels from the available forecasts.</p></div>
      <div className="staff-context">
        {airports.value && <RecordField searchable name="dashboard-airport" label="Airport" value={selectedAirport} onChange={setAirport} options={airports.value.map(option => ({ value: String(option.id), label: `${option.code} ? ${option.name}`, searchText: `${option.city} ${option.country}` }))} />}
        <p><strong>Next 30 days</strong>{result && <span>{calendarDateLabel(result.period_start)} ? {calendarDateLabel(result.period_end)}</span>}</p>
      </div>
    </header>
    {isLoading && <p role="status">Loading airport summary?</p>}
    {(summary.error || airports.error) && <><RecordAlert kind="error">Unable to load the airport summary. Please try again.</RecordAlert><button className="record-button record-secondary" onClick={() => setAttempt(value => value + 1)}>Retry summary</button></>}
    {result && <>
      {!result.airport && <p>No airports available.</p>}
      {result.airport && Object.values(result.counts).every(count => count === 0) && <p>No data for this airport in this period.</p>}
      <section className="staff-metrics" aria-label="30-day crowd summary">
        {LEVELS.map(level => <article className="staff-card" key={level}><h2>{LABELS[level]} crowd days</h2><p className="staff-metric-value">{result.counts[level]}</p></article>)}
        <article className="staff-card"><h2>Busiest weekday</h2><p className="staff-metric-value">{result.busiest_weekday ?? 'No data'}</p><p>Among high crowd days</p></article>
      </section>
      <section className="staff-level-cards" aria-label="Dates by crowd level">
        {LEVELS.map(level => <article className="staff-card" key={level}>
          <h2>{LABELS[level]} crowd days</h2><p>{result.counts[level]} days</p>
          {result.dates[level].length ? <ul className="staff-date-list">{result.dates[level].map(day => <li key={day.date} className={`staff-date-chip staff-level-${level}`}><time dateTime={day.date}>{day.weekday.slice(0, 3)}, {new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(calendarDate(day.date))}</time><span className="sr-only"> {LABELS[level]} crowd</span></li>)}</ul> : <p>No {level} crowd days in this period.</p>}
        </article>)}
      </section>
      <section className="staff-card" aria-labelledby="staff-next-title"><h2 id="staff-next-title">Next 7 days</h2>
        <ol className="staff-seven-days">{result.next_7_days.map(day => <li key={day.date} className={`staff-level-${day.crowd_level ?? 'none'}`}>
          <time dateTime={day.date}><span>{day.weekday.slice(0, 3)}</span><strong>{calendarDate(day.date).getUTCDate()}</strong><span>{new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(calendarDate(day.date))}</span></time>
          <span>{day.crowd_level ? `${LABELS[day.crowd_level]} crowd` : 'No data'}</span>
        </li>)}</ol>
      </section>
      <ComparisonCard comparison={result.comparison} />
    </>}
    <OwnRecordsCard />
  </>
}

export default function StaffDashboard() {
  const { profile } = useAuth()
  const { signOut, isSigningOut } = useSignOut()
  const [accessAttempt, setAccessAttempt] = useState(0)
  const [access, setAccess] = useState<'loading' | 'allowed' | 'denied' | 'error'>('loading')
  useEffect(() => {
    let isActive = true
    void getDashboardAccess().then(() => { if (isActive) setAccess('allowed') })
      .catch(error => { if (isActive) setAccess(error instanceof ApiError && error.status === 403 ? 'denied' : 'error') })
    return () => { isActive = false }
  }, [accessAttempt])
  return <>
    <AppNavbar userName={profile?.username ?? ''} onSignOut={signOut} isSigningOut={isSigningOut} navigation="staff" />
    <main className="staff-dashboard record-page">
      {access === 'loading' && <p role="status">Checking dashboard access?</p>}
      {access === 'denied' && <RecordAlert kind="error">You do not have access to the Staff dashboard.</RecordAlert>}
      {access === 'error' && <RecordAlert kind="error">Unable to load the dashboard. Please try again later.</RecordAlert>}
      {access === 'error' && <button type="button" className="record-button record-secondary" onClick={() => { setAccess('loading'); setAccessAttempt(value => value + 1) }}>Retry access</button>}
      {access === 'allowed' && <DashboardContent />}
    </main>
  </>
}
