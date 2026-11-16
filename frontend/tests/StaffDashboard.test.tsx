// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, setProfile } from '../src/api/authState'
import { ApiError } from '../src/api/client'
import { januaryDays } from '../src/data/homeSample'
import StaffDashboard from '../src/features/staff-dashboard/StaffDashboard'
import { getDashboardAccess } from '../src/features/staff-dashboard/api'
import { summarizeCrowdDays } from '../src/features/staff-dashboard/summary'

vi.mock('../src/features/staff-dashboard/api', () => ({ getDashboardAccess: vi.fn() }))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 0, 2, 12))
  vi.mocked(getDashboardAccess).mockReset().mockResolvedValue({ detail: 'Sample data', is_sample: true })
  setProfile({ id: 1, username: 'staff_user', email: 'staff@example.com', first_name: '', last_name: '', role: 'staff' })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  clearSession()
  vi.useRealTimers()
})

async function render() {
  await act(async () => root.render(<MemoryRouter initialEntries={['/staff/dashboard']}><StaffDashboard /></MemoryRouter>))
}

describe('Staff dashboard calculations', () => {
  it('computes January counts and the busiest weekday from correctly aligned dates', () => {
    const summary = summarizeCrowdDays(januaryDays, new Date(2026, 0, 2))
    expect(summary.counts).toEqual({ High: 8, Medium: 11, Low: 12 })
    expect(summary.busiestWeekdays).toEqual(['Sunday'])
    expect(summary.upcomingHighDays[0]!.date.getDay()).toBe(6)
    expect(summary.upcomingHighDays[0]!.date.getDate()).toBe(3)
    expect(summary.upcomingHighDays[1]!.date.getDay()).toBe(0)
  })

  it('includes today and excludes earlier dates using the live local day', () => {
    const summary = summarizeCrowdDays(januaryDays, new Date(2026, 0, 18, 23, 59))
    expect(summary.upcomingHighDays.map(day => day.date.getDate())).toEqual([18, 24, 25, 26])
    expect(summary.nextSevenDays.map(day => day.date.getDate())).toEqual([18, 19, 20, 21, 22, 23, 24])
  })

  it('handles a week crossing the end of the sample month without inventing levels', () => {
    const summary = summarizeCrowdDays(januaryDays, new Date(2026, 0, 28))
    expect(summary.nextSevenDays.map(day => day.date.getDate())).toEqual([28, 29, 30, 31, 1, 2, 3])
    expect(summary.nextSevenDays.slice(4).every(day => day.level === undefined)).toBe(true)
    expect(summary.nextSevenDays[4]!.date.getMonth()).toBe(1)
  })

  it('returns empty upcoming sample days after January while retaining monthly totals', () => {
    const summary = summarizeCrowdDays(januaryDays, new Date(2026, 10, 16))
    expect(summary.upcomingHighDays).toEqual([])
    expect(summary.nextSevenDays.every(day => day.level === undefined)).toBe(true)
    expect(summary.counts.High + summary.counts.Medium + summary.counts.Low).toBe(31)
  })

  it('reports tied busiest weekdays and no high days accurately', () => {
    const days = [{ date: new Date(2026, 0, 3), level: 'High' as const }, { date: new Date(2026, 0, 4), level: 'High' as const }]
    expect(summarizeCrowdDays(days, new Date(2026, 0, 1)).busiestWeekdays).toEqual(['Sunday', 'Saturday'])
    expect(summarizeCrowdDays([], new Date()).busiestWeekdays).toEqual([])
  })
})

describe('Staff dashboard page', () => {
  it('renders real sample metrics, weekdays, and only the available Dashboard navigation', async () => {
    await render()
    expect(getDashboardAccess).toHaveBeenCalledOnce()
    expect(container.querySelector('h1')?.textContent).toBe('Crowd overview')
    expect([...container.querySelectorAll('.staff-metric-value')].map(item => item.textContent)).toEqual(['8', '11', '12', 'Sunday'])
    expect(container.textContent).toContain('Sample data')
    expect(container.textContent).toContain('staff_user')
    expect(container.querySelector('.staff-seven-days time')?.textContent).toBe('Fri2Jan')
    expect(container.querySelector('.staff-upcoming strong')?.textContent).toBe('Sat, Jan 3, 2026')
    expect([...container.querySelectorAll('.app-nav-links a')].map(link => link.textContent)).toEqual(['Dashboard'])
    expect(container.querySelector('a[aria-current="page"]')?.getAttribute('href')).toBe('/staff/dashboard')
    expect(container.textContent).not.toContain('Charts')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('shows no upcoming January days at the live November date', async () => {
    vi.setSystemTime(new Date(2026, 10, 16))
    await render()
    expect(container.textContent).toContain('No upcoming high-crowd days in the January 2026 sample data.')
    expect(container.querySelectorAll('.staff-level-none')).toHaveLength(7)
  })

  it('updates the next-seven-day panel after local midnight', async () => {
    vi.setSystemTime(new Date(2026, 0, 2, 23, 59, 30))
    await render()
    await act(async () => { vi.advanceTimersByTime(60_000) })
    expect(container.querySelector('.staff-seven-days time')?.textContent).toBe('Sat3Jan')
  })

  it('does not reveal the summary while server authorization is pending', async () => {
    vi.mocked(getDashboardAccess).mockReturnValue(new Promise(() => {}))
    await render()
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Checking dashboard access')
    expect(container.querySelector('.staff-metrics')).toBeNull()
  })

  it.each([403, 500])('withholds dashboard content after a server %s response', async status => {
    vi.mocked(getDashboardAccess).mockRejectedValue(new ApiError(status, {}))
    await render()
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(container.querySelector('.staff-metrics')).toBeNull()
  })
})
