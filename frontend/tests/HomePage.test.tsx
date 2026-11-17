// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from '../src/features/homepage/HomePage'
import { loadAirports } from '../src/api/lookups'
import { loadFlights, loadForecasts } from '../src/api/traffic'

vi.mock('../src/api/lookups', () => ({ loadAirports: vi.fn() }))
vi.mock('../src/api/traffic', () => ({ loadFlights: vi.fn(), loadForecasts: vi.fn() }))

import { setProfile, clearSession } from '../src/api/authState'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-14T04:00:00Z'))
  vi.mocked(loadAirports).mockResolvedValue([{ id: 1, code: 'CEB', name: 'Cebu', city: 'Cebu', country: 'Philippines' }])
  vi.mocked(loadForecasts).mockResolvedValue([
    { id: 1, airport: 1, date: '2026-01-14', crowd_level: 'high', crowd_score: null, is_calculated: false, flight_count: 2, seats_total: 180, seats_booked: 124, calculated_at: '2026-01-01T00:00:00Z', data_source: 'Staff entry' },
    { id: 2, airport: 1, date: '2026-01-17', crowd_level: 'medium', crowd_score: null, is_calculated: false, flight_count: 2, seats_total: 180, seats_booked: 124, calculated_at: '2026-01-01T00:00:00Z', data_source: 'Staff entry' },
  ])
  vi.mocked(loadFlights).mockResolvedValue([])
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  setProfile({ id: 1, username: 'larce', email: 'larce@example.com', first_name: '', last_name: '', role: 'traveler' })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => root.render(<MemoryRouter initialEntries={['/home']}><HomePage /></MemoryRouter>))
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  clearSession()
  vi.useRealTimers()
})
function dayButton(day: number): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(`button[aria-label^="January ${day},"]`)
  if (!button) throw new Error('Missing day: ' + day)
  return button
}
describe('Home page', () => {
  it('greets the authenticated user and renders the main heading', () => {
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('h1')?.textContent).toBe('Check airport crowds and flights')
    expect(container.querySelector('.eyebrow')?.textContent).toBe('WELCOME BACK, LARCE')
  })
  it('uses the shared real-data calendar with correct weekdays and enabled navigation', () => {
    const grid = container.querySelector('.airport-day-grid')
    expect(grid?.querySelectorAll('button')).toHaveLength(31)
    expect([...grid!.children].indexOf(dayButton(1))).toBe(11)
    expect(dayButton(14).getAttribute('aria-pressed')).toBe('true')
    expect(grid?.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1)
    expect(container.querySelectorAll('button[disabled]')).toHaveLength(0)
    expect(loadForecasts).toHaveBeenCalledWith({ airport: '1', month: '2026-01' })
  })
  it('shows the API forecast instead of the January sample level', () => {
    const panel = container.querySelector('.airport-date-details')
    expect(panel?.querySelector('h3')?.textContent).toBe('January 14, 2026')
    expect(panel?.querySelector('.record-crowd-chip')?.textContent).toBe('High crowd')
    expect(panel?.textContent).toContain('No flights listed for this date.')
    expect(container.querySelector('.home-sample-label')).toBeNull()
  })
  it('selects January 17 and loads flights for that date', async () => {
    await act(async () => dayButton(17).click())
    const panel = container.querySelector('.airport-date-details')
    expect(panel?.querySelector('h3')?.textContent).toBe('January 17, 2026')
    expect(panel?.querySelector('.record-crowd-chip')?.textContent).toBe('Medium crowd')
    expect(loadFlights).toHaveBeenLastCalledWith({ airport: '1', date: '2026-01-17' })
    expect(dayButton(17).getAttribute('aria-pressed')).toBe('true')
    expect(dayButton(14).getAttribute('aria-pressed')).toBe('false')
  })
  it('shows only empty states for bookings and recent searches without sample content', () => {
    expect(container.querySelector('[aria-labelledby="upcoming-title"]')?.textContent).toContain('No upcoming bookings yet.')
    expect(container.querySelector('[aria-labelledby="recent-title"]')?.textContent).toContain('No recent searches yet.')
    expect(container.textContent).not.toContain('Sample data')
    expect(container.textContent).not.toContain('View all')
    expect(container.textContent).not.toContain('JFK')
    expect(container.querySelector('form, svg, .trip-row')).toBeNull()
  })
  it('shows the active Home link, calendar destination and no notifications', () => {
    expect(container.querySelector('nav a[href="/home"][aria-current="page"]')?.textContent).toBe('Home')
    expect(container.querySelector('a[href="/calendar"]')?.textContent).toBe('Traffic Calendar')
    expect(container.querySelector('.brand')?.getAttribute('href')).toBe('/home')
    expect(container.querySelector('[aria-label="Notifications"]')).toBeNull()
  })
})
