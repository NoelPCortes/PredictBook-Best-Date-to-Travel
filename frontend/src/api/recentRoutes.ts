export type RecentRoute = { origin: string; destination: string }
const key = (userId: number) => `predictbook:recent-routes:${userId}`
export function readRecentRoutes(userId: number): RecentRoute[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key(userId)) ?? '[]')
    if (!Array.isArray(saved)) return []
    const routes: RecentRoute[] = []
    for (const item of saved) {
      if (!item || typeof item !== 'object' || Object.keys(item).length !== 2 || typeof item.origin !== 'string' || typeof item.destination !== 'string' || !item.origin || !item.destination || item.origin === item.destination) continue
      if (!routes.some(route => route.origin === item.origin && route.destination === item.destination)) routes.push({ origin: item.origin, destination: item.destination })
    }
    return routes.slice(0, 5)
  } catch { return [] }
}
export function saveRecentRoute(userId: number, route: RecentRoute): RecentRoute[] {
  const routes = [route, ...readRecentRoutes(userId).filter(item => item.origin !== route.origin || item.destination !== route.destination)].slice(0, 5)
  localStorage.setItem(key(userId), JSON.stringify(routes))
  return routes
}
export function clearRecentRoutes(userId: number) { localStorage.removeItem(key(userId)) }
