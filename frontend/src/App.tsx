import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignInPage from './features/signin/SignInPage'
import SignUpPage from './features/signup/SignUpPage'
import HomePage from './features/homepage/HomePage'
import { loadProfile } from './features/homepage/api'
import { clearSession, setProfile, useAuth } from './api/authState'
import { readTokens } from './api/authStorage'

function SessionBootstrap({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  const [isChecking, setIsChecking] = useState(() => Boolean(readTokens()))
  useEffect(() => { navigateRef.current = navigate }, [navigate])
  useEffect(() => {
    let isActive = true
    const expire = () => { clearSession(); navigateRef.current('/signin', { replace: true }) }
    window.addEventListener('auth:expired', expire)
    if (readTokens()) {
      void loadProfile().then(profile => { if (isActive) setProfile(profile) })
        .catch(() => { if (isActive) expire() })
        .finally(() => { if (isActive) setIsChecking(false) })
    } else {
      clearSession()
    }
    return () => { isActive = false; window.removeEventListener('auth:expired', expire) }
  }, [])
  if (isChecking) return <p role="status">Checking your session…</p>
  return children
}

export function SessionRoute({ children, isProtected = false }: { children: ReactNode; isProtected?: boolean }) {
  const { profile, isLoading } = useAuth()
  if (isLoading) return <p role="status">Checking your session…</p>
  if (isProtected && !profile) return <Navigate to="/signin" replace />
  if (!isProtected && profile) return <Navigate to="/home" replace />
  return children
}

export function AppRoutes() {
  return <SessionBootstrap><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/signin" element={<SessionRoute><SignInPage /></SessionRoute>} />
    <Route path="/signup" element={<SessionRoute><SignUpPage /></SessionRoute>} />
    <Route path="/home" element={<SessionRoute isProtected><HomePage /></SessionRoute>} />
  </Routes></SessionBootstrap>
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}



