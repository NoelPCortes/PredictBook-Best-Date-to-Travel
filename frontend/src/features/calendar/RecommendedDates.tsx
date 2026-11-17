import { useCallback, useId, useState } from 'react'
import type { CalendarSelection } from '../../components/AirportCalendar'
import CrowdChip from '../../components/CrowdChip'
import { calendarDateLabel } from '../../components/calendarDates'
import RecordAlert from '../../components/RecordAlert'
import { useRemoteResource } from '../../components/useRemoteResource'
import bulbIcon from '../../assets/icons/bulbIcon.png'
import { loadDateRecommendations } from './api'
import './CalendarInsights.css'

export default function RecommendedDates({ airport, date, onSelectDate }: CalendarSelection) {
  const [attempt, setAttempt] = useState(0)
  const heading = useId()
  const load = useCallback(() => loadDateRecommendations(airport, date), [airport, date])
  const resource = useRemoteResource(`recommendations/${airport}/${date}/${attempt}`, load)
  const result = resource.value
  return <section className="calendar-recommendations" aria-labelledby={heading} aria-live="polite">
    <h2 id={heading}><img src={bulbIcon} alt="" />Recommended best date to travel</h2>
    {!result && !resource.error && <p role="status">Loading recommended dates…</p>}
    {resource.error && <><RecordAlert kind="error">{resource.error}</RecordAlert><button type="button" className="calendar-text-button" onClick={() => setAttempt(value => value + 1)}>Retry recommendations</button></>}
    {result && <>
      {!result.selected.has_data && <p>Your selected date has no forecast. These dates have forecasts and open departing seats; no score comparison is available.</p>}
      {result.selected.has_data && result.selected.crowd_score === null && <p>Your selected forecast has no numeric score. No score comparison is available.</p>}
      {result.message && <p>{result.message}</p>}
      <div className="calendar-recommendation-grid">{result.recommendations.map(recommendation => <button type="button" className="calendar-recommendation-card" key={recommendation.date} onClick={() => onSelectDate(recommendation.date)} aria-label={`Select ${calendarDateLabel(recommendation.date)}, ${recommendation.crowd_level} crowd`}>
        <span className="recommendation-date">{recommendation.weekday}, {calendarDateLabel(recommendation.date)}</span>
        <CrowdChip level={recommendation.crowd_level} />
        <span>Score: {recommendation.crowd_score.toFixed(1)}</span>
        {recommendation.score_difference !== null && <span>{recommendation.score_difference.toFixed(1)} points lower than your selected date</span>}
        <span>{recommendation.open_seats} open seats</span>
        <span className="recommendation-reasons" role="list">{recommendation.reasons.map(reason => <span role="listitem" key={reason}>{reason}</span>)}</span>
      </button>)}</div>
    </>}
  </section>
}
