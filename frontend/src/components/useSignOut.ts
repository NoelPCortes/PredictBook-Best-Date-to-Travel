import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession } from '../api/authState'
import { logout } from '../api/session'

export function useSignOut() {
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  async function signOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try { await logout() } catch { /* Complete local sign-out even without a connection. */ }
    finally { clearSession(); navigate('/signin', { replace: true }) }
  }
  return { signOut, isSigningOut }
}
