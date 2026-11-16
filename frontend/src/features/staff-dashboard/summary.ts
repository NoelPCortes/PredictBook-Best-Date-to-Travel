import type { CrowdLevel } from '../../data/homeSample'

type CrowdDay = { date: Date; level: CrowdLevel }
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function summarizeCrowdDays(days: readonly CrowdDay[], now: Date) {
  const counts: Record<CrowdLevel, number> = { Low: 0, Medium: 0, High: 0 }
  const highDaysByWeekday = Array<number>(7).fill(0)
  for (const day of days) {
    counts[day.level] += 1
    if (day.level === 'High') highDaysByWeekday[day.date.getDay()]! += 1
  }
  const highestCount = Math.max(...highDaysByWeekday)
  const busiestWeekdays = WEEKDAYS.filter((_, index) => highestCount > 0 && highDaysByWeekday[index] === highestCount)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const nextSevenDays = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)
    return { date, level: days.find(day => dateKey(day.date) === dateKey(date))?.level }
  })
  const upcomingHighDays = days.filter(day => day.level === 'High' && day.date >= today)
    .toSorted((first, second) => first.date.getTime() - second.date.getTime())
  return { counts, busiestWeekdays, nextSevenDays, upcomingHighDays }
}
