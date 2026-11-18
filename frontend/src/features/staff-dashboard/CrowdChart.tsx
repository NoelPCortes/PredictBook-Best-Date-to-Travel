import { useState } from 'react'
import { calendarDate } from '../../components/calendarDates'
import type { DashboardSummary, WeekdayRange } from './types'

const shortDate = (date: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(calendarDate(date))
function detail(row: WeekdayRange) {
  return row.day_count && row.min_date && row.max_date
    ? `${row.weekday}: least ${row.min_score}% on ${shortDate(row.min_date)}, most ${row.max_score}% on ${shortDate(row.max_date)}, across ${row.day_count} days. The busiest day has ${row.max_day_seats_booked} of ${row.max_day_seats_total} seats booked on ${row.max_day_flight_count} flights.`
    : `${row.weekday}: No data.`
}
export default function CrowdChart({ summary }: { summary: DashboardSummary }) {
  const [selected, setSelected] = useState('')
  const rows = summary.weekday_ranges
  const active = rows.find(row => row.weekday === selected) ?? rows[0]
  return <section className="staff-card" aria-labelledby="crowd-chart-title">
    <h2 id="crowd-chart-title">Crowd overview by weekday</h2>
    <p>Least to most congested day for each weekday in the next 30 days. UTC dates; score scale: 0 to 100%. Manual forecasts without a score use matching 2025 history when available.</p>
    {rows.every(row => !row.day_count) && <p>No forecast data for this airport in this period.</p>}
    <div className="crowd-chart-scroll" role="region" aria-label="Weekday crowd score range chart" tabIndex={0}>
      <div className="crowd-chart-plot">
        <div className="crowd-chart-references" aria-hidden="true"><span className="crowd-reference medium-line">Medium from 50</span><span className="crowd-reference high-line">High from 75</span></div>
        <div className="crowd-chart-columns">{rows.map(row => {
          const known = row.day_count > 0 && row.min_score !== null && row.max_score !== null
          const level = row.max_score !== null && row.max_score >= 75 ? 'high' : row.max_score !== null && row.max_score >= 50 ? 'medium' : 'low'
          return <button type="button" className="crowd-chart-day" key={row.weekday} aria-label={detail(row)} aria-pressed={active?.weekday === row.weekday} onClick={() => setSelected(row.weekday)} onFocus={() => setSelected(row.weekday)} onMouseEnter={() => setSelected(row.weekday)}>
            <span className="crowd-chart-track">{known ? <span className={`crowd-chart-fill ${level}`} style={{ bottom: `${row.min_score}%`, height: `${Number((row.max_score! - row.min_score!).toFixed(1))}%` }}><span className="crowd-chart-most">Most {row.max_score}%</span><span className="crowd-chart-least">Least {row.min_score}%</span></span> : <span className="crowd-chart-empty">No data</span>}</span>
            <span className="crowd-chart-date"><strong>{row.weekday.slice(0,3)}</strong></span>
          </button>
        })}</div>
        <div className="crowd-chart-groups" aria-label="Weekday groups"><span className="weekday-bracket">Weekdays</span><span className="weekend-bracket">Weekend <span className="sr-only">(Sun and Sat)</span></span></div>
      </div>
    </div>
    <div className="crowd-chart-legend">{['low','medium','high','no-data'].map(level => <span key={level}><i aria-hidden="true" className={level} />{level === 'no-data' ? 'No data' : level[0]!.toUpperCase() + level.slice(1)}</span>)}</div>
    {active && <p className="crowd-chart-details" aria-live="polite">{detail(active)}</p>}
  </section>
}
