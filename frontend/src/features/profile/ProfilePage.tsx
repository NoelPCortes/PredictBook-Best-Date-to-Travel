import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../api/authState'
import Brand from '../../components/Brand'
import { useSignOut } from '../../components/useSignOut'
import { ROLE_LANDING_PATHS } from '../../types/auth'
import ProfileInformation from './ProfileInformation'
import PasswordSecurity from './PasswordSecurity'
import '../../components/AuthLayout.css'
import './ProfilePage.css'

export default function ProfilePage() {
  const { profile } = useAuth()
  const { signOut, isSigningOut } = useSignOut()
  const location = useLocation()
  if (!profile) return null
  const landingLabel = profile.role === 'head' ? 'Head management' : profile.role === 'staff' ? 'Dashboard' : 'Home'
  return <div className="profile-page">
    <aside className="profile-sidebar">
      <Brand to={ROLE_LANDING_PATHS[profile.role]} />
      <nav aria-label="Account navigation">
        <Link to={ROLE_LANDING_PATHS[profile.role]}>{landingLabel}</Link>
        <p>My account</p>
        <Link to="/profile#profile-information" onClick={() => document.getElementById('profile-information')?.focus()} aria-current={location.hash !== '#password-security' ? 'location' : undefined}>Profile Information</Link>
        <Link to="/profile#password-security" onClick={() => document.getElementById('password-security')?.focus()} aria-current={location.hash === '#password-security' ? 'location' : undefined}>Password &amp; Security</Link>
      </nav>
      <button type="button" onClick={signOut} disabled={isSigningOut}>{isSigningOut ? 'Signing out…' : 'Sign Out'}</button>
    </aside>
    <main className="profile-content">
      <header><p className="eyebrow">My account</p><h1>My account</h1><p>Manage your account details and security.</p></header>
      <ProfileInformation profile={profile} />
      <PasswordSecurity />
    </main>
  </div>
}
