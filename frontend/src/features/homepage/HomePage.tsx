import { useAuth } from '../../api/authState'
import { useSignOut } from '../../components/useSignOut'
import AppNavbar from '../../components/AppNavbar'
import HomeCalendar from '../../components/HomeCalendar'
import './HomePage.css'

export default function HomePage() {
  const { profile } = useAuth()
  const { signOut, isSigningOut } = useSignOut()
  return <>
    <AppNavbar userName={profile?.username ?? ''} onSignOut={signOut} isSigningOut={isSigningOut} />
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-intro">
          <p className="eyebrow">WELCOME BACK, {profile?.username.toUpperCase()}</p>
          <h1 id="home-title">Check airport crowds and flights</h1>
          <p>See airport crowd levels and flight information by date.</p>
        </div>
        <HomeCalendar />
      </section>
      <div className="home-summary">
        <section className="summary-card" aria-labelledby="upcoming-title"><h2 id="upcoming-title">Your upcoming booking</h2><p>No upcoming bookings yet.</p></section>
        <section className="summary-card" aria-labelledby="recent-title"><h2 id="recent-title">Recent searches</h2><p>No recent searches yet.</p></section>
      </div>
    </main>
  </>
}
