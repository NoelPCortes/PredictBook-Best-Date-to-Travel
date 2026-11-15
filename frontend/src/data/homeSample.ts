export type CrowdLevel = 'Low' | 'Medium' | 'High'
export const sampleUser = { name: 'Larce' } as const
export const januaryLevels: readonly CrowdLevel[] = [
  'Medium', 'Medium', 'High', 'High', 'Medium', 'Low', 'Low', 'Low',
  'Medium', 'High', 'High', 'Medium', 'Low', 'Low', 'Low', 'Low',
  'Medium', 'High', 'Medium', 'Low', 'Low', 'Low', 'Medium', 'High',
  'High', 'High', 'Medium', 'Low', 'Low', 'Medium', 'Medium',
]
export const januaryDays = januaryLevels.map((level, index) => ({
  day: index + 1,
  level,
  date: new Date(2026, 0, index + 1),
}))
export const sampleBookingInfo = { day: 14, flights: 124, seats: '~ 82%', bookings: 1 } as const
export const upcomingBooking = {
  origin: 'JFK', destination: 'LAX', date: new Date(2026, 0, 14), travelers: '1 adult', cabin: 'Economy',
} as const
export const recentSearches = [
  { origin: 'JFK', destination: 'LAX', dates: 'Jan 14 – Jan 18, 2026' },
  { origin: 'SFO', destination: 'NRT', dates: 'Feb 10 – Feb 18, 2026' },
] as const
export function formatHomeDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }).format(date)
}
