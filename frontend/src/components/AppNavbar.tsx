import { NavLink } from 'react-router-dom'
import Brand from './Brand'
import Icon from './Icon'
import './AppNavbar.css'

export default function AppNavbar({ userName }: { userName: string }) {
  return (
    <header className="app-header">
      <nav className="app-nav" aria-label="Main navigation">
        <Brand to="/home" />
        <div className="app-nav-links">
          <NavLink to="/home"><Icon name="home" />Home</NavLink>
          <NavLink to="/calendar"><Icon name="calendar" />Traffic Calendar</NavLink>
        </div>
        {/* TODO: Connect the account menu when it is implemented. */}
        <button className="user-chip" type="button"><span className="user-avatar"><Icon name="person" /></span>{userName}<Icon name="down" /></button>
      </nav>
    </header>
  )
}
