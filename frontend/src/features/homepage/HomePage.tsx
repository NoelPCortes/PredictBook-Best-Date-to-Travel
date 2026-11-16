import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, clearSession } from '../../api/authState'
import { logout } from './api'
import AppNavbar from '../../components/AppNavbar'
import HomeCalendar, { CrowdChip } from '../../components/HomeCalendar'
import Icon from '../../components/Icon'
import { formatHomeDate, recentSearches, upcomingBooking } from '../../data/homeSample'
import './HomePage.css'

export default function HomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  async function signOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try { await logout() } catch { /* Local sign-out must complete even without a connection. */ }
    finally { clearSession(); navigate('/signin', { replace: true }) }
  }
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  return <>
    <AppNavbar userName={profile?.username ?? ''} onSignOut={signOut} isSigningOut={isSigningOut} />
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-intro">
          <p className="eyebrow">WELCOME BACK, {profile?.username.toUpperCase()}</p>
          <h1 id="home-title">Search flights and check airport crowds</h1>
          <p>Find flights, see expected crowd levels, and view booking information by date.</p>
        </div>
        <HomeCalendar />
      </section>
      <form className="home-search search-bar" aria-label="Flight search" onSubmit={event => event.preventDefault()}>
        <div className="search-field"><label htmlFor="home-from">From</label><div><Icon name="pin" /><input id="home-from" name="from" placeholder="Departure city or airport" value={from} onChange={event => setFrom(event.target.value)} /></div></div>
        <button type="button" className="swap-button" aria-label="Swap from and to" onClick={() => { setFrom(to); setTo(from) }}><Icon name="swap" /></button>
        <div className="search-field"><label htmlFor="home-to">To</label><div><Icon name="pin" /><input id="home-to" name="to" placeholder="Destination city or airport" value={to} onChange={event => setTo(event.target.value)} /></div></div>
        <div className="search-field"><label htmlFor="home-date">Date</label><div><Icon name="calendar" /><input id="home-date" name="date" placeholder="Choose a date" /></div></div>
        {/* TODO: Connect flight search when results are implemented. */}
        <button type="button" className="button"><Icon name="search" />Search flights</button>
      </form>
      <p className="home-sample-label">Sample data: flight search, calendar, bookings, and recent searches.</p>
      <div className="home-summary">
        <section className="summary-card" aria-labelledby="upcoming-title">
          <h2 id="upcoming-title">Your upcoming booking</h2>
          {/* TODO: Connect the upcoming booking row to booking details. */}
          <button type="button" className="trip-row">
            <span className="plane-tile"><Icon name="plane" /></span>
            <span className="trip-copy"><strong>{upcomingBooking.origin} → {upcomingBooking.destination}</strong><span>{formatHomeDate(upcomingBooking.date)} · {upcomingBooking.travelers} · {upcomingBooking.cabin}</span></span>
            <CrowdChip level="Low" /><Icon name="chevron" />
          </button>
        </section>
        <section className="summary-card" aria-labelledby="recent-title">
          <div className="summary-heading"><h2 id="recent-title">Recent searches</h2>
            {/* TODO: Connect View all to search history. */}
            <button type="button" className="view-all">View all<Icon name="arrow" /></button>
          </div>
          {/* TODO: Connect recent search rows to flight search. */}
          {recentSearches.map(search => <button type="button" className="trip-row" key={search.origin}>
            <span className="plane-tile"><Icon name="plane" /></span>
            <span className="trip-copy"><strong>{search.origin} → {search.destination}</strong><span>{search.dates}</span></span><Icon name="chevron" />
          </button>)}
        </section>
      </div>
    </main>
  </>
}
