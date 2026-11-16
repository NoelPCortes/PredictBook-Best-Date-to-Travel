import type { ReactNode } from 'react'
import { useAuth } from '../api/authState'
import AppNavbar from './AppNavbar'
import { useSignOut } from './useSignOut'
import './RecordManagement.css'

export default function RecordLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const { signOut, isSigningOut } = useSignOut()
  return <>
    <AppNavbar navigation="staff" userName={profile?.username ?? ''} onSignOut={signOut} isSigningOut={isSigningOut} />
    <main className="record-page">{children}</main>
  </>
}
