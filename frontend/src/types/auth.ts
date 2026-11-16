export type Profile = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'traveler' | 'staff' | 'head'
}

export type Tokens = { access: string; refresh: string }
export type SigninResponse = Tokens & { profile: Profile }

export const ROLE_LANDING_PATHS: Record<Profile['role'], string> = {
  traveler: '/home',
  staff: '/staff/dashboard',
  head: '/head',
}
