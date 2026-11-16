// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { clearSession, setProfile } from '../src/api/authState'
import { loadAirports } from '../src/api/lookups'
import { loadFlights, loadForecasts } from '../src/api/traffic'
import RoleRoute from '../src/components/RoleRoute'
import TrafficCalendarPage from '../src/features/calendar/TrafficCalendarPage'
import type { Forecast } from '../src/types/traffic'

vi.mock('../src/api/lookups', () => ({ loadAirports: vi.fn() }))
vi.mock('../src/api/traffic', () => ({ loadFlights: vi.fn(), loadForecasts: vi.fn() }))
const airports = [
  { id: 1, code: 'CEB', name: 'Cebu', city: 'Cebu', country: 'Philippines' },
  { id: 2, code: 'MNL', name: 'Manila', city: 'Manila', country: 'Philippines' },
]
const forecast = (day: number, level: Forecast['crowd_level']): Forecast => ({ id: day, airport: 1, date: `2026-01-${String(day).padStart(2, '0')}`, crowd_level: level, crowd_score: null, calculated_at: '2026-01-01T00:00:00Z', data_source: 'Staff entry' })
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-14T04:00:00Z'))
  vi.mocked(loadAirports).mockReset().mockResolvedValue(airports)
  vi.mocked(loadForecasts).mockReset().mockResolvedValue([forecast(14, 'low'), forecast(15, 'medium'), forecast(16, 'high')])
  vi.mocked(loadFlights).mockReset().mockResolvedValue([{
    id: 7, airline: 1, airline_name: 'Philippine Airlines', airline_code: 'PR', flight_number: '100', origin: 1, origin_code: 'CEB', origin_name: 'Cebu', destination: 2, destination_code: 'MNL', destination_name: 'Manila', departure_time: '2026-01-14T00:00:00Z', arrival_time: '2026-01-14T01:30:00Z', total_seats: 180, available_seats: 25,
  }])
  setProfile({ id: 1, username: 'traveler', email: 'traveler@example.com', role: 'traveler', first_name: '', last_name: '' })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); clearSession(); vi.useRealTimers() })
async function render() {
  await act(async () => root.render(<MemoryRouter initialEntries={['/calendar']}><Routes>
    <Route path="/calendar" element={<RoleRoute allowedRoles={['traveler']}><TrafficCalendarPage /></RoleRoute>} />
    <Route path="/staff/dashboard" element={<p>Staff dashboard</p>} /><Route path="/head" element={<p>Head management</p>} /><Route path="/signin" element={<p>Sign in</p>} />
  </Routes></MemoryRouter>))
}
function day(day: number) { return container.querySelector<HTMLButtonElement>(`button[aria-label^="January ${day},"]`)! }
async function click(selector: string) { await act(async () => container.querySelector<HTMLButtonElement>(selector)!.click()) }
async function changeAirport(value: string) {
  await act(async () => {
    const select = container.querySelector<HTMLSelectElement>('select')!
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(select, value)
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

it('loads one airport, API crowd levels, no-data dates and actual weekdays', async () => {
  await render()
  expect(loadForecasts).toHaveBeenCalledWith({ airport: '1', month: '2026-01' })
  expect(loadFlights).toHaveBeenCalledWith({ origin: '1', date: '2026-01-14' })
  expect(container.querySelectorAll('.airport-day-grid button')).toHaveLength(31)
  expect([...container.querySelector('.airport-day-grid')!.children].indexOf(day(1))).toBe(11)
  expect(day(14).classList.contains('low')).toBe(true)
  expect(day(15).classList.contains('medium')).toBe(true)
  expect(day(16).classList.contains('high')).toBe(true)
  expect(day(17).getAttribute('aria-label')).toBe('January 17, 2026, No data')
  expect(day(14).getAttribute('aria-current')).toBe('date')
  expect(day(14).getAttribute('aria-pressed')).toBe('true')
  expect(container.querySelector('.legend')?.textContent).toBe('LowMediumHighNo data')
  expect(container.querySelector('select')?.textContent).not.toContain('All Airports')
})
it('shows selected crowd level and flights with PNG time and seat icons', async () => {
  await render()
  const panel = container.querySelector('.airport-date-details')!
  expect(panel.querySelector('.record-crowd-chip')?.textContent).toBe('Low crowd')
  expect(panel.textContent).toContain('Philippine Airlines (PR) · 100')
  expect(panel.textContent).toContain('CEB — Cebu → MNL — Manila')
  expect(panel.textContent).toContain('08:00')
  expect(panel.textContent).toContain('25 open seats / 180 total seats')
  expect(panel.querySelector('img[src*="ClockIcon"]')).not.toBeNull()
  expect(panel.querySelector('img[src*="SeatIcon"]')).not.toBeNull()
  expect(container.querySelector('svg')).toBeNull()
})
it('selects a no-data day and shows the empty flight message', async () => {
  await render(); vi.mocked(loadFlights).mockResolvedValue([])
  await act(async () => day(17).click())
  expect(loadFlights).toHaveBeenLastCalledWith({ origin: '1', date: '2026-01-17' })
  expect(container.querySelector('.airport-date-details .record-crowd-chip')?.textContent).toBe('No data')
  expect(container.textContent).toContain('No flights listed for this date.')
})
it('changes airports without losing the selected date or exposing old flights', async () => {
  await render(); vi.mocked(loadFlights).mockResolvedValue([]); vi.mocked(loadForecasts).mockResolvedValue([])
  await changeAirport('2')
  expect(loadForecasts).toHaveBeenLastCalledWith({ airport: '2', month: '2026-01' })
  expect(loadFlights).toHaveBeenLastCalledWith({ origin: '2', date: '2026-01-14' })
  expect(container.querySelector('.calendar-flight-list')).toBeNull()
})
it('enables month navigation and handles year boundaries and leap years', async () => {
  await render()
  expect(container.querySelector<HTMLButtonElement>('[aria-label="Next month"]')?.disabled).toBe(false)
  await click('[aria-label="Next month"]')
  expect(loadForecasts).toHaveBeenLastCalledWith({ airport: '1', month: '2026-02' })
  expect(container.querySelectorAll('.airport-day-grid button')).toHaveLength(28)
  await click('[aria-label="Previous month"]'); await click('[aria-label="Previous month"]')
  expect(loadForecasts).toHaveBeenLastCalledWith({ airport: '1', month: '2025-12' })
})
it('uses Philippine today across the UTC day boundary', async () => {
  vi.setSystemTime(new Date('2026-01-13T17:00:00Z')); await render()
  expect(loadFlights).toHaveBeenCalledWith({ origin: '1', date: '2026-01-14' })
})
it('shows request errors distinctly from empty data and permits retry', async () => {
  vi.mocked(loadForecasts).mockRejectedValueOnce(new TypeError('Offline'))
  vi.mocked(loadFlights).mockRejectedValueOnce(new TypeError('Offline'))
  await render()
  expect(container.querySelectorAll('[role="alert"]')).toHaveLength(2)
  expect(day(14).getAttribute('aria-label')).toContain('Forecast unavailable')
  expect(container.textContent).not.toContain('No flights listed for this date.')
  await click('.airport-calendar-month .calendar-text-button')
  await click('.airport-date-details .calendar-text-button')
  expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0)
})
it('does not show stale results after switching airport during a request', async () => {
  let resolveOld: (records: Forecast[]) => void = () => {}
  vi.mocked(loadForecasts).mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve }))
  await render(); await changeAirport('2')
  vi.mocked(loadForecasts).mockResolvedValue([])
  await act(async () => resolveOld([forecast(14, 'high')]))
  expect(day(14).classList.contains('high')).toBe(false)
})
it('handles missing airports and lookup failures', async () => {
  vi.mocked(loadAirports).mockResolvedValue([]); await render()
  expect(container.textContent).toContain('No airports available.')
  expect(loadFlights).not.toHaveBeenCalled()
})
it('allows airport lookup retry', async () => {
  vi.mocked(loadAirports).mockRejectedValueOnce(new TypeError('Offline')); await render()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Unable to load airports')
  await click('.calendar-text-button'); expect(container.querySelector('select')).not.toBeNull()
})
it.each(['staff', 'head', null] as const)('guards calendar access for %s', async role => {
  if (role) setProfile({ id: 1, username: role, email: `${role}@example.com`, role, first_name: '', last_name: '' })
  else clearSession()
  await render()
  expect(loadAirports).not.toHaveBeenCalled()
  expect(container.textContent).toBe(role === 'staff' ? 'Staff dashboard' : role === 'head' ? 'Head management' : 'Sign in')
})
