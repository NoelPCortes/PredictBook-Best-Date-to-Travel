import { useCallback, useState } from 'react'
import { useRemoteResource } from '../../components/useRemoteResource'
import RecordAlert from '../../components/RecordAlert'
import PageControls from '../../components/PageControls'
import FlightCards from '../../components/FlightCards'
import { searchRoute } from './api'
import type { RecentRoute } from './recentRoutes'

export default function RouteResults({ route, label }: { route: RecentRoute; label: string }) {
  const { origin, destination } = route
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const load = useCallback(() => searchRoute({ origin, destination }, page), [origin, destination, page])
  const result = useRemoteResource(`route-results/${route.origin}/${route.destination}/${page}/${attempt}`, load)
  return <section className="summary-card" aria-label="Route search results">
    <h2>Upcoming flights: {label}</h2><p>Flight times: Philippine time (Asia/Manila, UTC+08:00).</p>
    {!result.value && !result.error && <p role="status">Loading route flights...</p>}
    {result.error && <><RecordAlert kind="error">{result.error}</RecordAlert><button className="record-button record-secondary" onClick={() => setAttempt(value => value + 1)}>Retry route search</button></>}
    {result.value && <>{result.value.length ? <FlightCards flights={result.value} /> : <p>No upcoming flights from {label}.</p>}<PageControls rows={result.value} page={page} onChange={setPage} /></>}
  </section>
}
