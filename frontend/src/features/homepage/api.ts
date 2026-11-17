import { apiRequest } from '../../api/client'
import type { Profile } from '../../types/auth'
import { loadFlights } from '../../api/traffic'
import type { RecentRoute } from './recentRoutes'

export function loadProfile() {
  return apiRequest<Profile>('/api/accounts/profile/')
}

export { logout } from '../../api/session'

export function searchRoute(route: RecentRoute, page = 1, pageSize?: number) {
  return loadFlights({ ...route, upcoming: true, page, ...(pageSize ? { page_size: pageSize } : {}) })
}
export async function upcomingBooking(routes: RecentRoute[]) {
  const results = await Promise.all(routes.map(route => searchRoute(route, 1, 3)))
  const index = results.findIndex(result => (result.count ?? result.length) > 0)
  return index < 0 ? null : { route: routes[index]!, flights: results[index]!, count: results[index]!.count ?? results[index]!.length }
}
