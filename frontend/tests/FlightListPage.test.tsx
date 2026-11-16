// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { clearSession, setProfile } from '../src/api/authState'
import RoleRoute from '../src/components/RoleRoute'
import FlightListPage from '../src/features/flights/FlightListPage'
import { listFlights } from '../src/features/flights/api'
import type { Flight } from '../src/types/flights'

vi.mock('../src/features/flights/api', () => ({ listFlights: vi.fn() }))
export const flight: Flight = {
  id: 7, airline: 1, airline_name: 'Philippine Airlines', airline_code: 'PR', flight_number: '100',
  origin: 1, origin_code: 'CEB', origin_name: 'Cebu', destination: 2, destination_code: 'MNL', destination_name: 'Manila',
  departure_time: '2026-12-01T00:00:00Z', arrival_time: '2026-12-01T01:30:00Z',
  total_seats: 180, available_seats: 25, created_by_username: 'staff', can_edit: true,
}
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.mocked(listFlights).mockReset().mockResolvedValue([flight])
  setProfile({ id: 1, username: 'staff', email: 'staff@example.com', role: 'staff', first_name: '', last_name: '' })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); clearSession() })

async function render() {
  await act(async () => root.render(<MemoryRouter initialEntries={['/staff/flights']}><Routes>
    <Route path="/staff/flights" element={<RoleRoute allowedRoles={['staff', 'head']}><FlightListPage /></RoleRoute>} />
    <Route path="/home" element={<p>Traveler home</p>} /><Route path="/signin" element={<p>Sign in</p>} />
  </Routes></MemoryRouter>))
}

it('shows stored flights with Philippine times, seats, author and management links', async () => {
  await render()
  expect(listFlights).toHaveBeenCalledOnce()
  expect(container.textContent).toContain('Philippine Airlines (PR)')
  expect(container.textContent).toContain('CEB → MNL')
  expect(container.textContent).toContain('08:00')
  expect(container.textContent).toContain('09:30')
  expect(container.textContent).toContain('25 / 180')
  expect(container.querySelector('a[href="/staff/flights/new"]')?.textContent).toBe('Add flight')
  expect(container.querySelector('a[href="/staff/flights/7/edit"]')?.textContent).toBe('Edit')
  expect(container.querySelector('svg')).toBeNull()
})
it('hides edit for records the server marks as uneditable', async () => {
  vi.mocked(listFlights).mockResolvedValue([{ ...flight, can_edit: false }])
  await render()
  expect(container.querySelector('a[href$="/edit"]')).toBeNull()
})
it('shows an empty table message', async () => {
  vi.mocked(listFlights).mockResolvedValue([])
  await render()
  expect(container.textContent).toContain('No flights listed yet.')
})
it('shows loading before the request resolves', async () => {
  vi.mocked(listFlights).mockReturnValue(new Promise(() => {}))
  await render()
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Loading flights…')
  expect(container.querySelector('table')).toBeNull()
})
it('shows an error and permits retry', async () => {
  vi.mocked(listFlights).mockRejectedValueOnce(new TypeError('Offline'))
  await render()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Unable to load flights')
  await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Try again')!.click())
  expect(container.querySelector('table')).not.toBeNull()
})
it.each(['head', 'traveler', null] as const)('guards the flight list for %s', async role => {
  if (role) setProfile({ id: 2, username: role, email: `${role}@example.com`, role, first_name: '', last_name: '' })
  else clearSession()
  await render()
  expect(listFlights).toHaveBeenCalledTimes(role === 'head' ? 1 : 0)
  expect(container.textContent).toContain(role === 'head' ? 'Flights' : role === 'traveler' ? 'Traveler home' : 'Sign in')
})
