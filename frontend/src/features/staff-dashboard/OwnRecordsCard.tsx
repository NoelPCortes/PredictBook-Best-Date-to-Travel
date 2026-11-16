import { useState } from 'react'
import { getOwnRecordCounts } from './api'
import { useRemoteResource } from '../../components/useRemoteResource'
import RecordAlert from '../../components/RecordAlert'

export default function OwnRecordsCard() {
  const [attempt, setAttempt] = useState(0)
  const counts = useRemoteResource(`own-records/${attempt}`, getOwnRecordCounts)
  return <section className="staff-card own-records" aria-labelledby="own-records-title">
    <h2 id="own-records-title">Your records</h2>
    {!counts.value && !counts.error && <p role="status">Loading your records…</p>}
    {counts.error && <><RecordAlert kind="error">Unable to load your record counts. Please try again.</RecordAlert><button className="calendar-text-button" type="button" onClick={() => setAttempt(value => value + 1)}>Retry counts</button></>}
    {counts.value && <dl className="own-records-counts"><div><dt>Flights</dt><dd>{counts.value.flights}</dd></div><div><dt>Crowd forecasts</dt><dd>{counts.value.forecasts}</dd></div></dl>}
  </section>
}
