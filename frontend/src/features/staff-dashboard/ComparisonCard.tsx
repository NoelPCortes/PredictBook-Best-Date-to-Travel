import type { DashboardSummary } from './types'

export default function ComparisonCard({ comparison }: { comparison: DashboardSummary['comparison'] }) {
  const percent = (value: number | null) => value === null ? 'No data' : `${value.toFixed(1)}%`
  return <section className="staff-card" aria-labelledby="staff-comparison-title">
    <h2 id="staff-comparison-title">2026 flights vs 2025 history</h2>
    {comparison.average_occupancy_2025_percent === null && <p>No 2025 history for this period.</p>}
    <dl className="staff-comparison-values">
      <div><dt>Average booked share of 2026 flights</dt><dd>{percent(comparison.average_occupancy_2026_percent)}</dd></div>
      <div><dt>2025 average for the same days</dt><dd>{percent(comparison.average_occupancy_2025_percent)}</dd></div>
      <div><dt>Difference in percentage points</dt><dd>{comparison.difference_points === null ? 'No data' : comparison.difference_points.toFixed(1)}</dd></div>
      <div><dt>Days busier than last year</dt><dd>{comparison.days_busier_than_2025}</dd></div>
      <div><dt>Days quieter than last year</dt><dd>{comparison.days_quieter_than_2025}</dd></div>
      <div><dt>Days compared</dt><dd>{comparison.days_compared}</dd></div>
    </dl>
  </section>
}
