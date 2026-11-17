import { useState } from 'react'
import { calendarDate } from '../../components/calendarDates'
import type { DashboardSummary, SummaryDay } from './types'

const shortDate = (date: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(calendarDate(date))
function detail(date: string, row?: SummaryDay) {
  const weekday = row?.weekday ?? new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(calendarDate(date))
  return row?.crowd_score !== null && row?.crowd_score !== undefined
    ? `${weekday}, ${shortDate(date)}: ${row.crowd_level[0]!.toUpperCase()}${row.crowd_level.slice(1)} crowd, score ${row.crowd_score}%, ${row.seats_booked} of ${row.seats_total} seats booked on ${row.flight_count} flights.`
    : `${weekday}, ${shortDate(date)}: No data.`
}

export default function CrowdChart({ summary }: { summary: DashboardSummary }) {
  const [selected, setSelected] = useState('')
  const dates = Array.from({ length: 30 }, (_, index) => { const date = calendarDate(summary.period_start); date.setUTCDate(date.getUTCDate() + index); return date.toISOString().slice(0,10) })
  const rowFor = (date: string) => summary.days.find(day => day.date === date)
  const selectedDate = dates.includes(selected) ? selected : dates[0]!
  return <section className="staff-card" aria-labelledby="crowd-chart-title">
    <h2 id="crowd-chart-title">Crowd overview by day</h2>
    <p>Score scale: 0 to 100%. Manual forecasts without a score use matching 2025 history when available.</p>
    {!summary.days.length && <p>No forecast data for this airport in this period.</p>}
    <div className="crowd-chart-scroll" role="region" aria-label="30-day crowd score column chart" tabIndex={0}>
      <div className="crowd-chart-plot">
        <div className="crowd-chart-references" aria-hidden="true"><span className="crowd-reference medium-line">Medium from 50</span><span className="crowd-reference high-line">High from 75</span></div>
        <div className="crowd-chart-columns">{dates.map((date, index) => {
          const row = rowFor(date)
          const score = row?.crowd_score
          const known = score !== null && score !== undefined
          const monthChange = index === 0 || dates[index - 1]!.slice(0,7) !== date.slice(0,7)
          return <button type="button" className="crowd-chart-day" key={date} aria-label={detail(date,row)} aria-pressed={selectedDate === date} onClick={() => setSelected(date)} onFocus={() => setSelected(date)} onMouseEnter={() => setSelected(date)}>
            <span className="crowd-chart-track">{known ? <span className={`crowd-chart-fill ${row!.crowd_level}`} style={{ height: `${Math.max(0,Math.min(100,score))}%` }}><span className="crowd-chart-score">{Math.round(score)}</span></span> : <span className="crowd-chart-empty">No data</span>}</span>
            <span className="crowd-chart-date"><strong>{Number(date.slice(-2))}</strong>{monthChange && <span>{new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', weekday: 'short' }).format(calendarDate(date))}</span>}</span>
          </button>
        })}</div>
      </div>
    </div>
    <div className="crowd-chart-legend">{['low','medium','high','no-data'].map(level => <span key={level}><i aria-hidden="true" className={level} />{level === 'no-data' ? 'No data' : level[0]!.toUpperCase() + level.slice(1)}</span>)}</div>
    <p className="crowd-chart-details" aria-live="polite">{detail(selectedDate,rowFor(selectedDate))}</p>
  </section>
}
