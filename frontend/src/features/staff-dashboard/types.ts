import type { CrowdLevel } from '../../types/traffic'

export type SummaryDate = { date: string; weekday: string }
export type DashboardSummary = {
  airport: { id: number; code: string; name: string } | null
  period_start: string; period_end: string
  counts: Record<CrowdLevel, number>
  dates: Record<CrowdLevel, SummaryDate[]>
  busiest_weekday: string | null
  next_7_days: (SummaryDate & { crowd_level: CrowdLevel | null })[]
}
