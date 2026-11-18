// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { clearSession, setProfile } from '../src/api/authState'
import { ApiError } from '../src/api/client'
import { loadAirports } from '../src/api/lookups'
import StaffDashboard from '../src/features/staff-dashboard/StaffDashboard'
import { getDashboardAccess, getDashboardSummary, getOwnRecordCounts } from '../src/features/staff-dashboard/api'
import type { DashboardSummary } from '../src/features/staff-dashboard/types'

vi.mock('../src/features/staff-dashboard/api', () => ({ getDashboardAccess: vi.fn(), getDashboardSummary: vi.fn(), getOwnRecordCounts: vi.fn() }))
vi.mock('../src/api/lookups', () => ({ loadAirports: vi.fn() }))
const summary: DashboardSummary = {
  weekday_ranges: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((weekday, index) => ({
    weekday, day_count: index >= 1 && index <= 3 ? 2 : 0,
    min_score: index === 1 ? 20 : index === 2 ? 60 : index === 3 ? 40 : null,
    max_score: index === 1 ? 80.4 : index === 2 ? 60 : index === 3 ? 40 : null,
    min_date: index >= 1 && index <= 3 ? '2026-11-23' : null,
    max_date: index >= 1 && index <= 3 ? '2026-11-16' : null,
    max_day_seats_booked: index >= 1 && index <= 3 ? 124 : null,
    max_day_seats_total: index >= 1 && index <= 3 ? 180 : null,
    max_day_flight_count: index >= 1 && index <= 3 ? 3 : null,
  })),
  days: [
    {date:'2026-11-16',weekday:'Monday',crowd_level:'high',crowd_score:80.4,seats_booked:124,seats_total:180,flight_count:3},
    {date:'2026-11-17',weekday:'Tuesday',crowd_level:'medium',crowd_score:60,seats_booked:60,seats_total:100,flight_count:1},
    {date:'2026-11-18',weekday:'Wednesday',crowd_level:'low',crowd_score:40,seats_booked:40,seats_total:100,flight_count:1},
  ],
  comparison: { average_occupancy_2026_percent: 65, average_occupancy_2025_percent: 60, difference_points: 5, days_busier_than_2025: 1, days_quieter_than_2025: 1, days_compared: 3 },
  airport: { id: 2, code: 'MNL', name: 'Manila' }, period_start: '2026-11-16', period_end: '2026-12-15',
  counts: { high: 2, medium: 1, low: 1 }, busiest_weekday: 'Monday',
  dates: { high: [{ date: '2026-11-16', weekday: 'Monday' }, { date: '2026-11-23', weekday: 'Monday' }], medium: [{ date: '2026-11-17', weekday: 'Tuesday' }], low: [{ date: '2026-11-18', weekday: 'Wednesday' }] },
  next_7_days: [
    { date: '2026-11-16', weekday: 'Monday', crowd_level: 'high' }, { date: '2026-11-17', weekday: 'Tuesday', crowd_level: 'medium' },
    { date: '2026-11-18', weekday: 'Wednesday', crowd_level: 'low' }, { date: '2026-11-19', weekday: 'Thursday', crowd_level: null },
    { date: '2026-11-20', weekday: 'Friday', crowd_level: null }, { date: '2026-11-21', weekday: 'Saturday', crowd_level: null }, { date: '2026-11-22', weekday: 'Sunday', crowd_level: null },
  ],
}
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.mocked(getDashboardAccess).mockReset().mockResolvedValue({ detail: 'Access granted', is_sample: true })
  vi.mocked(getDashboardSummary).mockReset().mockResolvedValue(summary)
  vi.mocked(getOwnRecordCounts).mockReset().mockResolvedValue({ flights: 3, forecasts: 5 })
  vi.mocked(loadAirports).mockReset().mockResolvedValue([{ id: 1, code: 'CEB', name: 'Cebu', city: 'Cebu', country: 'Philippines' }, { id: 2, code: 'MNL', name: 'Manila', city: 'Manila', country: 'Philippines' }])
  setProfile({ id: 1, username: 'staff_user', email: 'staff@example.com', first_name: '', last_name: '', role: 'staff' })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); clearSession() })
async function render() { await act(async () => root.render(<MemoryRouter initialEntries={['/staff/dashboard']}><StaffDashboard /></MemoryRouter>)) }

it('renders live counts, period, default airport, every date and the seven-day strip in order', async () => {
  await render()
  expect(container.querySelector('.eyebrow')?.textContent).toBe('STAFF DASHBOARD')
  expect([...container.querySelectorAll('.staff-metric-value')].map(item => item.textContent)).toEqual(['2', '1', '1', 'Monday'])
  expect(container.querySelector<HTMLButtonElement>('[role=combobox]')?.value).toBe('2')
  expect(container.querySelector('.staff-context')?.textContent).toContain('Next 30 daysNovember 16, 2026')
  expect([...container.querySelectorAll('.staff-level-cards time')].map(item => item.textContent)).toEqual(['Mon, Nov 16', 'Mon, Nov 23', 'Tue, Nov 17', 'Wed, Nov 18'])
  expect(container.querySelectorAll('.staff-seven-days li')).toHaveLength(7)
  expect(container.querySelector('.staff-seven-days')?.textContent).toContain('High crowd')
  expect(container.querySelector('.staff-seven-days')?.textContent).toContain('No data')
  expect(container.querySelector('.staff-dashboard')?.lastElementChild?.classList.contains('own-records')).toBe(true)
  expect([...container.querySelectorAll('.own-records dd')].map(item => item.textContent)).toEqual(['3', '5'])
  expect(container.textContent).not.toContain('Sample data')
  expect(container.textContent).not.toContain('January')
  expect(container.textContent).not.toContain('Charts')
  expect(container.querySelector('svg')).toBeNull()
})
it('changes the airport using the summary endpoint', async () => {
  await render()
  await act(async () => container.querySelector<HTMLButtonElement>('[role=combobox]')!.click())
  await act(async () => container.querySelector<HTMLElement>('[role=option][data-value="1"]')!.click())
  expect(getDashboardSummary).toHaveBeenLastCalledWith('1')
})
it('shows the real flight and history comparison', async () => {
  await render()
  expect(container.textContent).toContain('2026 flights vs 2025 history')
  expect([...container.querySelectorAll('.staff-comparison-values dd')].map(item => item.textContent)).toEqual(['65.0%', '60.0%', '5.0', '1', '1', '3'])
})
it('shows missing history without inventing a comparison', async () => {
  vi.mocked(getDashboardSummary).mockResolvedValue({ ...summary, comparison: { ...summary.comparison, average_occupancy_2025_percent: null, difference_points: null, days_compared: 0 } })
  await render()
  expect(container.textContent).toContain('No 2025 history for this period.')
  expect(container.querySelectorAll('.staff-comparison-values dd')[1]?.textContent).toBe('No data')
})
it('shows zero counts and useful empty messages without inventing dates', async () => {
  vi.mocked(getDashboardSummary).mockResolvedValue({ ...summary, counts: { high: 0, medium: 0, low: 0 }, dates: { high: [], medium: [], low: [] }, busiest_weekday: null })
  await render()
  expect(container.textContent).toContain('No data for this airport in this period.')
  for (const level of ['high', 'medium', 'low']) expect(container.textContent).toContain(`No ${level} crowd days in this period.`)
  expect(container.querySelector('.staff-level-cards time')).toBeNull()
})
it('shows loading while summary is pending', async () => {
  vi.mocked(getDashboardSummary).mockReturnValue(new Promise(() => {})); await render()
  expect(container.textContent).toContain('Loading airport summary')
  expect(container.querySelector('.staff-metrics')).toBeNull()
})
it('shows summary errors and allows retry', async () => {
  vi.mocked(getDashboardSummary).mockRejectedValueOnce(new TypeError('Offline')); await render()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Unable to load the airport summary')
  await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Retry summary')!.click())
  expect(container.querySelector('.staff-metrics')).not.toBeNull()
})
it.each([403, 500])('withholds protected data after access error %s', async status => {
  vi.mocked(getDashboardAccess).mockRejectedValueOnce(new ApiError(status, {})); await render()
  expect(container.querySelector('[role="alert"]')).not.toBeNull()
  expect(getDashboardSummary).not.toHaveBeenCalled(); expect(getOwnRecordCounts).not.toHaveBeenCalled()
})
it('handles own-record count errors independently', async () => {
  vi.mocked(getOwnRecordCounts).mockRejectedValueOnce(new TypeError('Offline')); await render()
  expect(container.querySelector('.own-records [role="alert"]')).not.toBeNull()
  expect(container.querySelector('.staff-metrics')).not.toBeNull()
})

it('renders seven accessible weekday ranges, references and selected details', async () => {
  await render()
  expect(container.querySelectorAll('.crowd-chart-day')).toHaveLength(7)
  expect([...container.querySelectorAll('.crowd-chart-date strong')].map(item=>item.textContent)).toEqual(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])
  const fills=[...container.querySelectorAll<HTMLElement>('.crowd-chart-fill')]
  expect(fills.map(bar=>bar.style.height)).toEqual(['60.4%','0%','0%'])
  expect(fills.map(bar=>bar.style.bottom)).toEqual(['20%','60%','40%'])
  expect(container.querySelector('.crowd-chart-fill.high')).not.toBeNull()
  expect(container.querySelector('.crowd-chart-fill.medium')).not.toBeNull()
  expect(container.querySelector('.crowd-chart-fill.low')).not.toBeNull()
  expect(container.querySelector('.crowd-chart-legend')?.textContent).toBe('LowMediumHighNo data')
  expect(container.querySelector('.crowd-chart-references')?.textContent).toContain('Medium from 50')
  expect(container.querySelector('.crowd-chart-references')?.textContent).toContain('High from 75')
  expect(container.querySelector('.weekday-bracket')?.textContent).toBe('Weekdays')
  expect(container.querySelector('.weekend-bracket')?.textContent).toContain('Weekend')
  expect(container.querySelector('.crowd-chart-most')?.textContent).toBe('Most 80.4%')
  expect(container.querySelector('.crowd-chart-least')?.textContent).toBe('Least 20%')
  const monday=container.querySelectorAll<HTMLButtonElement>('.crowd-chart-day')[1]!
  expect(monday.getAttribute('aria-label')).toBe('Monday: least 20% on Nov 23, most 80.4% on Nov 16, across 2 days. The busiest day has 124 of 180 seats booked on 3 flights.')
  await act(async () => monday.click())
  expect(container.querySelector('.crowd-chart-details')?.textContent).toBe(monday.getAttribute('aria-label'))
  await act(async () => container.querySelectorAll<HTMLButtonElement>('.crowd-chart-day')[0]!.focus())
  expect(container.querySelector('.crowd-chart-details')?.textContent).toContain('Sunday: No data')
})
it('renders seven no-data slots when the range series has no scores', async () => {
  vi.mocked(getDashboardSummary).mockResolvedValue({...summary, weekday_ranges: summary.weekday_ranges.map(row=>({...row,day_count:0,min_score:null,max_score:null,min_date:null,max_date:null,max_day_seats_booked:null,max_day_seats_total:null,max_day_flight_count:null}))})
  await render()
  expect(container.querySelectorAll('.crowd-chart-empty')).toHaveLength(7)
  expect(container.textContent).toContain('No forecast data for this airport in this period.')
})
it('keeps the Staff dashboard outside the calendar-only navy page frame', async () => {
  await render()
  expect(container.querySelector('.staff-dashboard')).not.toBeNull()
  expect(container.querySelector('.traffic-calendar-page, .traffic-calendar-title')).toBeNull()
})
