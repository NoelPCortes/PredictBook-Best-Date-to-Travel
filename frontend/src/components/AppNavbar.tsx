import { NavLink } from 'react-router-dom'
import Brand from './Brand'
import Icon from './Icon'
import './AppNavbar.css'

export default function AppNavbar({ userName, onSignOut, isSigningOut }: { userName: string; onSignOut: () => void; isSigningOut: boolean }) {
  return (
    <header className="app-header">
      <nav className="app-nav" aria-label="Main navigation">
        <Brand to="/home" />
        <div className="app-nav-links">
          <NavLink to="/home">Home</NavLink>
          <NavLink to="/calendar"><Icon name="calendar" />Traffic Calendar</NavLink>
        </div>
        <span className="user-chip">{userName}</span>
        <button className="button signout-button" type="button" onClick={onSignOut} disabled={isSigningOut}>{isSigningOut ? 'Signing out?' : 'Sign out'}</button>
      </nav>
    </header>
  )
}
