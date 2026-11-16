export const FLIGHT_TIME_ZONE = 'Asia/Manila'

export function formatFlightTime(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: FLIGHT_TIME_ZONE, year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}
