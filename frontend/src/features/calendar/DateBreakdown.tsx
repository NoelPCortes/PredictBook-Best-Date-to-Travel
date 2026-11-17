import { useCallback, useId, useState } from 'react'
import type { CalendarSelection } from '../../components/AirportCalendar'
import { calendarDateLabel } from '../../components/calendarDates'
import RecordAlert from '../../components/RecordAlert'
import { useRemoteResource } from '../../components/useRemoteResource'
import infoIcon from '../../assets/icons/info-circleIcon.png'
import { loadDateExplanation } from './api'
import './CalendarInsights.css'

export default function DateBreakdown({ airport, date, forecast }: CalendarSelection) {
  const [attempt, setAttempt] = useState(0)
  const load = useCallback(() => loadDateExplanation(airport, date), [airport, date])
  const resource = useRemoteResource(`explanation/${airport}/${date}/${attempt}`, load)
  const heading = useId()
  const result = resource.value
  const percent = (value: number | null) => value === null ? 'No data' : `${value.toFixed(1)}%`
  return <section className="calendar-breakdown" aria-labelledby={heading}>
    <h4 id={heading}><img src={infoIcon} alt="" />Why this level</h4>
    {forecast && !forecast.is_calculated && <p>Manual forecast: {forecast.crowd_level}. Calculated blend:</p>}
    {!result && !resource.error && <p role="status">Loading level breakdown…</p>}
    {resource.error && <><RecordAlert kind="error">{resource.error}</RecordAlert><button type="button" className="calendar-text-button" onClick={() => setAttempt(value => value + 1)}>Retry breakdown</button></>}
    {result && <>
      {!result.has_data && <p>No calculated forecast: no flights with seat data for this date.</p>}
      <ul>{result.sentences.map(sentence => <li key={sentence}>{sentence}</li>)}</ul>
      <div className="record-table-scroll"><table className="record-table">
        <caption>Calculated crowd score breakdown</caption>
        <thead><tr><th scope="col">Source</th><th scope="col">Booked share or score</th></tr></thead>
        <tbody>
          <tr><th scope="row">2026 flights</th><td>{result.flights.seats_booked} of {result.flights.seats_total} seats; {percent(result.flights.occupancy_percent)}</td></tr>
          <tr><th scope="row">2025 history (same weekday, around this date)</th><td>{percent(result.history.average_occupancy_percent)}</td></tr>
          <tr><th scope="row">Combined score</th><td>{result.crowd_score?.toFixed(1) ?? 'No data'}</td></tr>
        </tbody>
      </table></div>
      <p>History dates used: {result.history.used_dates.length ? result.history.used_dates.map(calendarDateLabel).join('; ') : 'None'}</p>
    </>}
  </section>
}
