// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readRecentRoutes, saveRecentRoute, clearRecentRoutes } from '../src/api/recentRoutes'
import HomePage from '../src/features/homepage/HomePage'
import { loadAirports } from '../src/api/lookups'
import { loadFlights, loadForecasts, loadRouteDates } from '../src/api/traffic'

vi.mock('../src/api/lookups', () => ({ loadAirports: vi.fn() }))
vi.mock('../src/api/traffic', () => ({ loadFlights: vi.fn(), loadForecasts: vi.fn(), loadRouteDates: vi.fn() }))

import { setProfile, clearSession } from '../src/api/authState'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(async () => {
  clearRecentRoutes(1); clearRecentRoutes(2)
  vi.mocked(loadRouteDates).mockResolvedValue([{ date: '2026-01-14', flight_count: 3, open_seats: 90 }])
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-14T04:00:00Z'))
  vi.mocked(loadAirports).mockResolvedValue([{ id: 1, code: 'CEB', name: 'Cebu', city: 'Cebu', country: 'Philippines' }, { id: 2, code: 'NRT', name: 'Narita', city: 'Tokyo', country: 'Japan' }])
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
  clearSession(); clearRecentRoutes(1); clearRecentRoutes(2)
  vi.useRealTimers()
})
function dayButton(day: number): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(`button[aria-label^="January ${day},"]`)
  if (!button) throw new Error('Missing day: ' + day)
  return button
}
describe('Home page', () => {
  it('does not include the calendar-only breakdown or recommendations', () => {
    expect(container.textContent).not.toContain('Why this level')
    expect(container.textContent).not.toContain('Recommended best date to travel')
    expect(container.querySelector('.calendar-breakdown, .calendar-recommendations')).toBeNull()
  })
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
    expect(container.querySelector('[aria-labelledby="upcoming-title"]')?.textContent).toContain('No upcoming booking yet. Search flights to get started.')
    expect(container.querySelector('[aria-labelledby="recent-title"]')?.textContent).toContain('No recent searches yet.')
    expect(container.textContent).not.toContain('Sample data')
    expect(container.textContent).not.toContain('View all')
    expect(container.textContent).not.toContain('JFK')
    expect(container.querySelector('svg, .trip-row')).toBeNull()
  })
  it('shows the active Home link, calendar destination and no notifications', () => {
    expect(container.querySelector('nav a[href="/home"][aria-current="page"]')?.textContent).toBe('Home')
    expect(container.querySelector('a[href="/calendar"]')?.textContent).toBe('Traffic Calendar')
    expect(container.querySelector('.brand')?.getAttribute('href')).toBe('/home')
    expect(container.querySelector('[aria-label="Notifications"]')).toBeNull()
  })
})

async function selectAirport(name: string, value: string) {
  await act(async () => container.querySelector<HTMLButtonElement>(`[name="${name}"]`)!.click())
  await act(async () => container.querySelector<HTMLElement>(`[role=option][data-value="${value}"]`)!.click())
}
async function searchRoute() { await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))) }
it('validates same airports and highlights only the searched route dates', async () => {
  await selectAirport('home-origin','1'); await selectAirport('home-destination','1'); await searchRoute()
  expect(container.textContent).toContain('From and To must be different airports.')
  await selectAirport('home-destination','2'); await searchRoute()
  expect(loadFlights).toHaveBeenCalledWith(expect.objectContaining({origin:'1',destination:'2',upcoming:true}))
  expect(loadRouteDates).toHaveBeenCalledWith('1','2','2026-01')
  expect(dayButton(14).getAttribute('aria-label')).toBe('January 14, 2026, 3 flights from CEB to NRT, High crowd')
  expect(dayButton(14).classList.contains('route-highlight')).toBe(true)
  expect(dayButton(17).classList.contains('medium')).toBe(false)
  expect(dayButton(17).getAttribute('aria-label')).toContain('No flights on this route')
  expect(container.textContent).toContain('No upcoming flights from CEB to NRT.')
  expect(readRecentRoutes(1)).toEqual([{origin:'1',destination:'2'}])
  await act(async () => [...container.querySelectorAll('button')].find(button=>button.textContent==='Show all crowd levels')!.click())
  expect(dayButton(17).classList.contains('medium')).toBe(true)
})
it('stores five distinct routes newest first per user and clears only those routes', async () => {
  for (let i=1;i<=6;i++) saveRecentRoute(1,{origin:String(i),destination:String(i+1)})
  saveRecentRoute(1,{origin:'3',destination:'4'})
  expect(readRecentRoutes(1)).toHaveLength(5)
  expect(readRecentRoutes(1)[0]).toEqual({origin:'3',destination:'4'})
  expect(readRecentRoutes(2)).toEqual([])
  expect(Object.keys(JSON.parse(localStorage.getItem('predictbook:recent-routes:1')!)[0]).sort()).toEqual(['destination','origin'])
  clearRecentRoutes(1); expect(readRecentRoutes(1)).toEqual([])
})
it('uses the most recent route with upcoming flights for the booking and supports recent clicks and Clear', async () => {
  saveRecentRoute(1,{origin:'2',destination:'1'}); saveRecentRoute(1,{origin:'1',destination:'2'})
  const flight = {id:9, airline:1,airline_code:'PR',airline_name:'Airline',flight_number:'123',origin:2,origin_code:'NRT',origin_name:'Narita',destination:1,destination_code:'CEB',destination_name:'Cebu',departure_time:'2026-01-15T00:00:00Z',arrival_time:'2026-01-15T02:00:00Z',total_seats:100,available_seats:50}
  vi.mocked(loadFlights).mockImplementation(async filters => filters?.upcoming && filters.origin==='2' ? Object.assign([flight],{count:7}) : [])
  await act(async () => root.render(<MemoryRouter><HomePage key="new-history" /></MemoryRouter>))
  const booking = container.querySelector('[aria-labelledby="upcoming-title"]')!
  expect(booking.textContent).toContain('NRT to CEB')
  expect(booking.textContent).toContain('7 upcoming flights')
  expect(booking.querySelectorAll('time')).toHaveLength(1)
  await act(async () => booking.querySelector<HTMLButtonElement>('button')!.click())
  expect(loadFlights).toHaveBeenCalledWith(expect.objectContaining({origin:'2',destination:'1',upcoming:true,page:1}))
  expect(container.querySelector('[aria-label="Route search results"]')?.textContent).toContain('Airline (PR)')
  await act(async () => container.querySelector<HTMLButtonElement>('.home-recent-routes button')!.click())
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-labelledby=recent-title] button')!.click())
  expect(readRecentRoutes(1)).toEqual([])
  expect(container.textContent).not.toContain('Why this level')
  expect(container.textContent).not.toContain('Recommended best date to travel')
})
async function setOptional(name: string, value: string) {
  const input = container.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)!
  const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
  await act(async () => { Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })) })
}
it('validates optional ranges and dates before searching, and saves routes only', async () => {
  await selectAirport('home-origin', '1'); await selectAirport('home-destination', '2')
  await setOptional('departure_hour_from', '12'); await setOptional('departure_hour_to', '6')
  vi.mocked(loadFlights).mockClear()
  await searchRoute()
  expect(container.textContent).toContain('The ending hour cannot be earlier than the starting hour.')
  expect(loadFlights).not.toHaveBeenCalled()
  await setOptional('departure_hour_to', '23')
  await setOptional('departure_date', '2026-01-20'); await setOptional('arrival_date', '2026-01-19')
  await searchRoute()
  expect(container.textContent).toContain('Arrival date cannot be before the departure date.')
  expect(loadFlights).not.toHaveBeenCalled()
  await setOptional('arrival_date', '2026-01-20')
  await setOptional('arrival_hour_from', '0'); await setOptional('arrival_hour_to', '23')
  await searchRoute()
  expect(loadFlights).toHaveBeenCalledWith(expect.objectContaining({ origin: '1', destination: '2', upcoming: false, departure_date: '2026-01-20', arrival_date: '2026-01-20', departure_hour_from: '12', departure_hour_to: '23', arrival_hour_from: '0', arrival_hour_to: '23', page_size: 4 }))
  expect(readRecentRoutes(1)).toEqual([{ origin: '1', destination: '2' }])
  expect(container.textContent?.match(/Ranges that cross midnight are not supported./g)).toHaveLength(2)
  await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Clear optional filters')!.click())
  expect(container.querySelector<HTMLInputElement>('[name=departure_date]')!.value).toBe('')
})
it('keeps upcoming for hours without dates and appends four-flight pages', async () => {
  await selectAirport('home-origin', '1'); await selectAirport('home-destination', '2')
  await setOptional('departure_hour_from', '6')
  const flights = Array.from({length: 8}, (_, index) => ({ id: index + 1, airline: 1, airline_name: 'Test', airline_code: 'TA', flight_number: `F${index}`, origin: 1, origin_code: 'CEB', origin_name: 'Cebu', destination: 2, destination_code: 'NRT', destination_name: 'Narita', departure_time: '2026-01-20T00:00:00Z', arrival_time: '2026-01-20T02:00:00Z', available_seats: 50, total_seats: 100 }))
  vi.mocked(loadFlights).mockImplementation(async filters => filters?.page_size === 4 ? Object.assign(flights.slice(filters.page === 2 ? 4 : 0, filters.page === 2 ? 8 : 4), {count: 8, next: filters.page === 2 ? null : '?page=2'}) : [])
  await searchRoute()
  const results = container.querySelector('[aria-label="Route search results"]')!
  expect(results.textContent).toContain('Showing 4 of 8 flights')
  expect(loadFlights).toHaveBeenCalledWith(expect.objectContaining({upcoming: true, departure_hour_from: '6', page_size: 4}))
  await act(async () => [...results.querySelectorAll('button')].find(button => button.textContent === 'See more')!.click())
  expect(results.textContent).toContain('Showing 8 of 8 flights')
  expect([...results.querySelectorAll('button')].some(button => button.textContent === 'See more')).toBe(false)
  await searchRoute()
  expect(container.querySelector('[aria-label="Route search results"]')?.textContent).toContain('Showing 4 of 8 flights')
  expect(container.querySelector('.home-search-card')!.compareDocumentPosition(container.querySelector('.home-summary')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
