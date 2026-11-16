import { NavLink } from 'react-router-dom'
import Brand from './Brand'
import './AppNavbar.css'

export default function AppNavbar({ userName, onSignOut, isSigningOut, navigation = 'traveler' }: { userName: string; onSignOut: () => void; isSigningOut: boolean; navigation?: 'traveler' | 'staff' | 'head' }) {
  return (
    <header className={`app-header${navigation !== 'traveler' ? ' app-header-staff' : ''}`}>
      <nav className="app-nav" aria-label="Main navigation">
        <Brand to={navigation === 'head' ? '/head' : navigation === 'staff' ? '/staff/dashboard' : '/home'} />
        <div className="app-nav-links">
          {navigation === 'head' ? <>
            <NavLink to="/head">Head management</NavLink>
            <NavLink to="/staff/dashboard">Dashboard</NavLink>
          </> : navigation === 'staff' ? <><NavLink to="/staff/dashboard">Dashboard</NavLink><NavLink to="/staff/flights">Flights</NavLink><NavLink to="/staff/forecasts">Crowd forecasts</NavLink></> : <>
            <NavLink to="/home">Home</NavLink>
            <NavLink to="/calendar">Traffic Calendar</NavLink>
          </>}
        </div>
        <NavLink to="/profile" className="user-chip account-link" aria-label={`My account: ${userName}`}>{userName}</NavLink>
        <button className="button signout-button" type="button" onClick={onSignOut} disabled={isSigningOut}>{isSigningOut ? 'Signing out?' : 'Sign out'}</button>
      </nav>
    </header>
  )
}
