import { useSyncExternalStore } from 'react'
import type { Profile } from '../types/auth'
import { clearTokens, readTokens } from './authStorage'

let snapshot: { profile: Profile | null; isLoading: boolean } = {
  profile: null, isLoading: Boolean(readTokens()),
}
const listeners = new Set<() => void>()

export function setProfile(profile: Profile | null) {
  snapshot = { profile, isLoading: false }
  listeners.forEach(listener => listener())
}

export function clearSession() {
  clearTokens()
  setProfile(null)
}

export function useAuth() {
  return useSyncExternalStore(
    listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
    () => snapshot,
  )
}
