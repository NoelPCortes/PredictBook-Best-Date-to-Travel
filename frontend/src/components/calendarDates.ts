import { FLIGHT_TIME_ZONE } from './flightTime'

export function philippineToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: FLIGHT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === name)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function calendarDate(value: string): Date { return new Date(`${value}T12:00:00Z`) }
export function calendarDateLabel(value: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(calendarDate(value))
}
export function monthLabel(month: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long' }).format(calendarDate(`${month}-01`))
}
export function changeMonth(month: string, offset: number): string {
  const date = calendarDate(`${month}-01`)
  date.setUTCMonth(date.getUTCMonth() + offset)
  return date.toISOString().slice(0, 7)
}
export function monthDates(month: string): string[] {
  const first = calendarDate(`${month}-01`)
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0))
  return Array.from({ length: last.getUTCDate() }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`)
}
