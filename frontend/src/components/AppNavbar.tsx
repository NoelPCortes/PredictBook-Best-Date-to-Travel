import { NavLink } from 'react-router-dom'
import Brand from './Brand'
import Icon from './Icon'
import './AppNavbar.css'

export default function AppNavbar({ userName, onSignOut, isSigningOut, navigation = 'traveler' }: { userName: string; onSignOut: () => void; isSigningOut: boolean; navigation?: 'traveler' | 'staff' }) {
  return (
    <header className={`app-header${navigation === 'staff' ? ' app-header-staff' : ''}`}>
      <nav className="app-nav" aria-label="Main navigation">
        <Brand to={navigation === 'staff' ? '/staff/dashboard' : '/home'} />
        <div className="app-nav-links">
          {navigation === 'staff' ? <NavLink to="/staff/dashboard">Dashboard</NavLink> : <>
            <NavLink to="/home">Home</NavLink>
            <NavLink to="/calendar"><Icon name="calendar" />Traffic Calendar</NavLink>
          </>}
        </div>
        <span className="user-chip">{userName}</span>
        <button className="button signout-button" type="button" onClick={onSignOut} disabled={isSigningOut}>{isSigningOut ? 'Signing out?' : 'Sign out'}</button>
      </nav>
    </header>
  )
}
