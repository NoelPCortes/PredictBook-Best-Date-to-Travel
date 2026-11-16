import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../api/authState'
import { ROLE_LANDING_PATHS } from '../types/auth'
import type { Profile } from '../types/auth'

type RoleRouteProps = {
  children: ReactNode
  allowedRoles: readonly Profile['role'][]
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { profile, isLoading } = useAuth()
  if (isLoading) return <p role="status">Checking your session…</p>
  if (!profile) return <Navigate to="/signin" replace />
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={ROLE_LANDING_PATHS[profile.role]} replace />
  }
  return children
}
