import type { CrowdLevel } from '../../types/traffic'

export type DateExplanation = {
  airport: { id: number; code: string; name: string }
  date: string; weekday: string; has_data: boolean
  flights: { count: number; departing_count: number; arriving_count: number; seats_total: number; seats_booked: number; occupancy_percent: number | null }
  history: { used_dates: string[]; records: { date: string; weekday: string; seats_booked: number; seats_total: number; occupancy_percent: number }[]; average_occupancy_percent: number | null }
  weights: { flights: number; history: number }
  thresholds: { medium_from: number; high_from: number }
  crowd_score: number | null; crowd_level: CrowdLevel | null; history_available: boolean
  open_seats: number; sentences: string[]
}
