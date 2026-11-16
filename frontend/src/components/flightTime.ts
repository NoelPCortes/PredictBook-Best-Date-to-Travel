export const FLIGHT_TIME_ZONE = 'Asia/Manila'

export function formatFlightTime(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: FLIGHT_TIME_ZONE, year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

export function flightTimeInput(value: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: FLIGHT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === name)!.value
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

export function flightTimePayload(value: string): string {
  return value ? `${value}+08:00` : ''
}
