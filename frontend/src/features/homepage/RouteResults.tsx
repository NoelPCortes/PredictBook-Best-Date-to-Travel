import { useCallback } from 'react'
import RecordAlert from '../../components/RecordAlert'
import FlightCards from '../../components/FlightCards'
import { useAppendPages } from '../../components/useAppendPages'
import { searchRoute } from './api'
import type { RecentRoute } from '../../api/recentRoutes'
import type { FlightFilters } from '../../api/traffic'

export default function RouteResults({ route, label, filters = {} }: { route: RecentRoute; label: string; filters?: FlightFilters }) {
  const { origin, destination } = route
  const filterKey = JSON.stringify(filters)
  const load = useCallback((page: number) => searchRoute({ origin, destination }, page, 4, JSON.parse(filterKey) as FlightFilters), [origin, destination, filterKey])
  const { result, seeMore, retry } = useAppendPages(`${origin}/${destination}/${filterKey}`, load)
  return <section className="summary-card home-route-results" aria-label="Route search results">
    <h2>Upcoming flights: {label}</h2><p>Flight times and search dates/hours: Philippine time (Asia/Manila, UTC+08:00).</p>
    {(!result || (result.loading && !result.page)) && <p role="status">Loading route flights...</p>}
    {result?.error && <><RecordAlert kind="error">{result.error}</RecordAlert><button className="record-button record-secondary" onClick={result.page ? seeMore : retry}>Retry route search</button></>}
    {result && result.page > 0 && <>{result.rows.length ? <FlightCards flights={result.rows} /> : <p>No upcoming flights from {label}.</p>}<p>Showing {result.rows.length} of {result.count} flights</p>{result.hasMore && <button className="record-button record-secondary" disabled={result.loading} onClick={seeMore}>{result.loading ? 'Loading more flights...' : 'See more'}</button>}</>}
  </section>
}
