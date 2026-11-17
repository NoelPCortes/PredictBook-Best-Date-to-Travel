// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { clearSession, setProfile } from '../src/api/authState'
import { ApiError } from '../src/api/client'
import RoleRoute from '../src/components/RoleRoute'
import ForecastFormPage from '../src/features/calendar/ForecastFormPage'
import ForecastListPage from '../src/features/calendar/ForecastListPage'
import { createForecast, deleteForecast, getForecast, loadForecastAirports, loadForecastList, updateForecast } from '../src/features/calendar/api'
import type { Forecast } from '../src/types/traffic'

vi.mock('../src/features/calendar/api', () => ({ createForecast: vi.fn(), deleteForecast: vi.fn(), updateForecast: vi.fn(), getForecast: vi.fn(), loadForecastAirports: vi.fn(), loadForecastList: vi.fn() }))
const forecast: Forecast = { id: 7, airport: 1, date: '2026-12-01', crowd_level: 'low', crowd_score: null, is_calculated: false, flight_count: 2, seats_total: 180, seats_booked: 124, calculated_at: '2026-11-16T00:00:00Z', data_source: 'Staff entry', created_by_username: 'staff', can_edit: true }
const airports = [{ id: 1, code: 'CEB', name: 'Cebu', city: 'Cebu', country: 'Philippines' }]
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.mocked(loadForecastAirports).mockReset().mockResolvedValue(airports)
  vi.mocked(loadForecastList).mockReset().mockResolvedValue([[forecast], airports])
  vi.mocked(getForecast).mockReset().mockResolvedValue(forecast)
  vi.mocked(createForecast).mockReset().mockResolvedValue(forecast)
  vi.mocked(updateForecast).mockReset().mockResolvedValue(forecast)
  vi.mocked(deleteForecast).mockReset().mockResolvedValue(undefined)
  setProfile({ id: 1, username: 'staff', email: 'staff@example.com', role: 'staff', first_name: '', last_name: '' })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); clearSession() })
async function render(path = '/staff/forecasts') {
  const protect = (page: React.ReactNode) => <RoleRoute allowedRoles={['staff', 'head']}>{page}</RoleRoute>
  await act(async () => root.render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/staff/forecasts" element={protect(<ForecastListPage />)} />
    <Route path="/staff/forecasts/new" element={protect(<ForecastFormPage />)} />
    <Route path="/staff/forecasts/:id/edit" element={protect(<ForecastFormPage />)} />
    <Route path="/home" element={<p>Traveler home</p>} /><Route path="/signin" element={<p>Sign in</p>} />
  </Routes></MemoryRouter>))
}
function field(name: string) { return container.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)! }
async function edit(name: string, value: string) {
  await act(async () => {
    const control = field(name)
    if (control.getAttribute('role') === 'combobox') {
      control.click()
      return
    }
    const prototype = control instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(control, value)
    control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
  })
  if (field(name).getAttribute('role') === 'combobox') await act(async () => {
    container.querySelector<HTMLElement>(`[role="option"][data-value="${value}"]`)!.click()
  })
}
async function submit() { await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))) }
async function click(selector: string) { await act(async () => container.querySelector<HTMLButtonElement>(selector)!.click()) }

it('lists airport, date, crowd chip with dot and text, score and author', async () => {
  await render()
  expect(container.textContent).toContain('CEB — Cebu')
  expect(container.textContent).toContain('2026-12-01')
  expect(container.querySelector('.record-crowd-chip')?.textContent).toBe('Low crowd')
  expect(container.querySelector('.record-crowd-chip i')).not.toBeNull()
  expect(container.querySelector('tbody')?.textContent).toContain('Staff entry')
  expect(container.querySelector('a[href="/staff/forecasts/new"]')?.textContent).toBe('Add forecast')
  expect(container.querySelector('.app-nav-links a[aria-current="page"]')?.textContent).toBe('Crowd forecasts')
  expect(container.querySelector('svg')).toBeNull()
})
it('hides edit and delete when can_edit is false', async () => {
  vi.mocked(loadForecastList).mockResolvedValue([[{ ...forecast, can_edit: false }], airports])
  await render()
  expect(container.querySelector('tbody a[href$="/edit"], tbody button')).toBeNull()
})
it('shows the empty table message', async () => {
  vi.mocked(loadForecastList).mockResolvedValue([[], airports]); await render()
  expect(container.textContent).toContain('No forecasts listed yet.')
})
it('handles list loading and failure', async () => {
  vi.mocked(loadForecastList).mockReturnValue(new Promise(() => {})); await render()
  expect(container.querySelector('[role="status"]')?.textContent).toContain('Loading forecasts')
})
it('permits retry after a failed list request', async () => {
  vi.mocked(loadForecastList).mockRejectedValueOnce(new TypeError('Offline')); await render()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Unable to load forecasts')
  await click('.record-page button'); expect(container.querySelector('table')).not.toBeNull()
})
it('cancels deletion and then deletes only after confirmation', async () => {
  await render(); await click('tbody button')
  expect(container.querySelector('[role="alertdialog"]')?.textContent).toContain('Delete forecast for CEB — Cebu on 2026-12-01? This cannot be undone.')
  expect(document.activeElement?.textContent).toBe('Cancel')
  await click('[role="alertdialog"] .record-ghost')
  expect(deleteForecast).not.toHaveBeenCalled()
  await click('tbody button'); await click('[role="alertdialog"] .record-danger')
  expect(deleteForecast).toHaveBeenCalledWith(7)
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Forecast deleted.')
  expect(container.textContent).toContain('No forecasts listed yet.')
})
it('keeps the row after a failed delete', async () => {
  vi.mocked(deleteForecast).mockRejectedValueOnce(new ApiError(403, { detail: 'Permission denied.' }))
  await render(); await click('tbody button'); await click('[role="alertdialog"] .record-danger')
  expect(container.querySelector('[role="alertdialog"] [role="alert"]')?.textContent).toBe('Permission denied.')
  expect(container.querySelector('tbody')?.textContent).toContain('CEB')
})
it('creates from five labeled fields without sending server-managed fields', async () => {
  await render('/staff/forecasts/new')
  expect(container.querySelectorAll('label')).toHaveLength(5)
  expect(container.querySelector('[name="created_by"], [name="calculated_at"]')).toBeNull()
  await edit('airport', '1'); await edit('date', '2026-12-01'); await edit('crowd_level', 'low'); await submit()
  expect(createForecast).toHaveBeenCalledWith({ airport: '1', date: '2026-12-01', crowd_level: 'low', crowd_score: null, data_source: '' })
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Forecast created.')
})
it('updates existing values and preserves optional negative scores without extra rules', async () => {
  await render('/staff/forecasts/7/edit')
  expect(field('airport').value).toBe('1'); expect(field('date').value).toBe('2026-12-01')
  await edit('crowd_level', 'high'); await edit('crowd_score', '-1.5'); await submit()
  expect(updateForecast).toHaveBeenCalledWith('7', expect.objectContaining({ crowd_level: 'high', crowd_score: '-1.5' }))
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Forecast updated.')
})
it.each(['airport', 'date', 'crowd_level', 'crowd_score', 'data_source'])('links backend %s messages and focuses the field', async name => {
  vi.mocked(createForecast).mockRejectedValueOnce(new ApiError(400, { [name]: ['Fix this value.'] }))
  await render('/staff/forecasts/new'); await submit()
  expect(field(name).getAttribute('aria-invalid')).toBe('true')
  expect(document.getElementById(field(name).getAttribute('aria-describedby')!)?.textContent).toBe('Fix this value.')
  expect(document.activeElement).toBe(field(name))
})
it('displays non-field errors and permits a save retry', async () => {
  vi.mocked(createForecast).mockRejectedValueOnce(new ApiError(400, { non_field_errors: ['Cannot save.'] }))
  await render('/staff/forecasts/new'); await submit()
  expect(container.querySelector('[role="alert"]')?.textContent).toBe('Cannot save.')
  await submit(); expect(container.querySelector('[role="status"]')?.textContent).toBe('Forecast created.')
})
it('withholds uneditable records and handles failed form loads', async () => {
  vi.mocked(getForecast).mockResolvedValue({ ...forecast, can_edit: false })
  await render('/staff/forecasts/7/edit')
  expect(container.querySelector('form')).toBeNull()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('permission to edit')
})
it('handles lookup errors', async () => {
  vi.mocked(loadForecastAirports).mockRejectedValue(new TypeError('Offline'))
  await render('/staff/forecasts/new')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Unable to load the forecast form')
})
it.each(['/staff/forecasts', '/staff/forecasts/new', '/staff/forecasts/7/edit'])('guards Traveler access to %s', async path => {
  setProfile({ id: 1, username: 'traveler', email: 'traveler@example.com', role: 'traveler', first_name: '', last_name: '' })
  await render(path); expect(container.textContent).toContain('Traveler home')
  expect(loadForecastList).not.toHaveBeenCalled(); expect(loadForecastAirports).not.toHaveBeenCalled()
})
it('allows Heads to create forecasts', async () => {
  setProfile({ id: 1, username: 'head', email: 'head@example.com', role: 'head', first_name: '', last_name: '' })
  await render('/staff/forecasts/new'); expect(container.querySelector('form')).not.toBeNull()
})


it('shows live seats and flight references for read-only calculated rows', async () => {
  vi.mocked(loadForecastList).mockResolvedValue([[{ ...forecast, is_calculated: true, can_edit: false, created_by_username: null }], airports])
  await render()
  expect(container.querySelector('tbody')?.textContent).toContain('124 of 180 seats, 68.9%')
  expect(container.querySelector('tbody')?.textContent).toContain('Calculated automatically')
  expect(container.querySelector('a[href="/staff/flights?airport=1&date=2026-12-01"]')?.textContent).toBe('View flights')
  expect(container.querySelector('tbody a[href$="/edit"], tbody button')).toBeNull()
})
