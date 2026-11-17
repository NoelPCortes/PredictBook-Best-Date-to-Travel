import type { CrowdLevel } from '../../types/traffic'

export type SummaryDate = { date: string; weekday: string }
export type DashboardSummary = {
  airport: { id: number; code: string; name: string } | null
  period_start: string; period_end: string
  counts: Record<CrowdLevel, number>
  dates: Record<CrowdLevel, SummaryDate[]>
  busiest_weekday: string | null
  next_7_days: (SummaryDate & { crowd_level: CrowdLevel | null })[]
  comparison: {
    average_occupancy_2026_percent: number | null
    average_occupancy_2025_percent: number | null
    difference_points: number | null
    days_busier_than_2025: number
    days_quieter_than_2025: number
    days_compared: number
  }
}
