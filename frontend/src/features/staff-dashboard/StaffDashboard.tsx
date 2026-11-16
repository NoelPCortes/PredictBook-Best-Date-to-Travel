import { useEffect, useState } from 'react'
import { useAuth } from '../../api/authState'
import { ApiError } from '../../api/client'
import AppNavbar from '../../components/AppNavbar'
import { useSignOut } from '../../components/useSignOut'
import { januaryDays } from '../../data/homeSample'
import { getDashboardAccess } from './api'
import { summarizeCrowdDays } from './summary'
import './StaffDashboard.css'
import OwnRecordsCard from './OwnRecordsCard'

export default function StaffDashboard() {
  const { profile } = useAuth()
  const { signOut, isSigningOut } = useSignOut()
  const [access, setAccess] = useState<'loading' | 'allowed' | 'denied' | 'error'>('loading')
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let isActive = true
    void getDashboardAccess().then(() => { if (isActive) setAccess('allowed') })
      .catch(error => { if (isActive) setAccess(error instanceof ApiError && error.status === 403 ? 'denied' : 'error') })
    return () => { isActive = false }
  }, [])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const summary = summarizeCrowdDays(januaryDays, now)
  return <>
    <AppNavbar userName={profile?.username ?? ''} onSignOut={signOut} isSigningOut={isSigningOut} navigation="staff" />
    <main className="staff-dashboard">
      <header className="staff-heading">
        <div><p className="eyebrow">Staff dashboard</p><h1>Crowd overview</h1><p>Key numbers on expected airport crowd levels and busy travel days.</p></div>
        <div className="staff-context"><span>January 2026</span><span>Sample data</span></div>
      </header>
      {access === 'loading' && <p role="status">Checking dashboard access…</p>}
      {access === 'denied' && <p role="alert">You do not have access to the Staff dashboard.</p>}
      {access === 'error' && <p role="alert">Unable to load the dashboard. Please try again later.</p>}
      {access === 'allowed' && <>
        <OwnRecordsCard />
        <section className="staff-metrics" aria-label="January crowd summary">
          {(['High', 'Medium', 'Low'] as const).map(level => <article className="staff-card" key={level}>
            <h2><span className={`staff-level-dot staff-level-${level.toLowerCase()}`} aria-hidden="true" />{level} crowd days</h2>
            <p className="staff-metric-value">{summary.counts[level]}</p>
          </article>)}
          <article className="staff-card"><h2>Busiest weekday</h2><p className="staff-metric-value">{summary.busiestWeekdays.join(', ') || 'No data'}</p><p>Most high-crowd days</p></article>
        </section>
        <div className="staff-panels">
          <section className="staff-card" aria-labelledby="staff-next-title">
            <h2 id="staff-next-title">Next 7 days</h2>
            <p>From {now.toLocaleDateString('en-US', { dateStyle: 'long' })}. Only January 2026 has sample data.</p>
            <ol className="staff-seven-days">{summary.nextSevenDays.map(day => <li key={day.date.toISOString()} className={`staff-level-${day.level?.toLowerCase() ?? 'none'}`}>
              <time dateTime={`${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`}>
                <span>{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <strong>{day.date.getDate()}</strong>
                <span>{day.date.toLocaleDateString('en-US', { month: 'short' })}</span>
              </time><span>{day.level ?? 'No data'}</span>
            </li>)}</ol>
          </section>
          <section className="staff-card" aria-labelledby="staff-upcoming-title">
            <h2 id="staff-upcoming-title">Upcoming high crowd days</h2>
            {summary.upcomingHighDays.length ? <ul className="staff-upcoming">{summary.upcomingHighDays.map(day => <li key={day.date.toISOString()}>
              <strong>{day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              <span className="staff-high-label">High crowd</span>
            </li>)}</ul> : <p>No upcoming high-crowd days in the January 2026 sample data.</p>}
          </section>
        </div>
      </>}
    </main>
  </>
}
