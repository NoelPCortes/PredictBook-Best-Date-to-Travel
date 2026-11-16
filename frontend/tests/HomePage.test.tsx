// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import HomePage from '../src/features/homepage/HomePage'

import { setProfile, clearSession } from '../src/api/authState'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(async () => {
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
})
function dayButton(day: number): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(`button[aria-label^="January ${day},"]`)
  if (!button) throw new Error('Missing day: ' + day)
  return button
}
function input(name: string): HTMLInputElement {
  const field = container.querySelector<HTMLInputElement>(`input[name="${name}"]`)
  if (!field) throw new Error('Missing field: ' + name)
  return field
}
async function type(name: string, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input(name), value)
    input(name).dispatchEvent(new Event('input', { bubbles: true }))
  })
}
describe('Home page', () => {
  it('greets the authenticated user and renders the main heading', () => {
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('h1')?.textContent).toBe('Search flights and check airport crowds')
    expect(container.querySelector('.eyebrow')?.textContent).toBe('WELCOME BACK, LARCE')
  })
  it('renders 31 days, aligns January 1 with Thursday and selects January 14', () => {
    const grid = container.querySelector('.home-day-grid')
    expect(grid?.querySelectorAll('button')).toHaveLength(31)
    expect(dayButton(1).style.gridColumnStart).toBe('5')
    expect([...grid!.children].indexOf(dayButton(1))).toBe(11)
    expect(dayButton(14).getAttribute('aria-pressed')).toBe('true')
    expect(grid?.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1)
    expect(container.querySelectorAll('button[disabled]')).toHaveLength(2)
  })
  it('starts with January 14 booking information', () => {
    const panel = container.querySelector('.booking-info')
    expect(panel?.querySelector('h3')?.textContent).toBe('Wed, Jan 14, 2026')
    expect(panel?.querySelector('.crowd-chip')?.textContent).toBe('Low crowd')
    expect([...panel!.querySelectorAll('dd')].map(value => value.textContent)).toEqual(['124', '~ 82%', '1'])
    expect(panel?.querySelector('dd .app-icon')).not.toBeNull()
  })
  it('selects January 17 and shows medium crowd with unavailable sample values', async () => {
    await act(async () => dayButton(17).click())
    const panel = container.querySelector('.booking-info')
    expect(panel?.querySelector('h3')?.textContent).toBe('Sat, Jan 17, 2026')
    expect(panel?.querySelector('.crowd-chip')?.textContent).toBe('Medium crowd')
    expect([...panel!.querySelectorAll('dd')].map(value => value.textContent)).toEqual(['—', '—', '0'])
    expect(panel?.querySelector('dd .app-icon')).toBeNull()
    expect(dayButton(17).getAttribute('aria-pressed')).toBe('true')
    expect(dayButton(14).getAttribute('aria-pressed')).toBe('false')
  })
  it('offers exactly From, To and Date fields and swaps the route', async () => {
    const form = container.querySelector('form')
    expect([...form!.querySelectorAll('label')].map(label => label.textContent)).toEqual(['From', 'To', 'Date'])
    expect(form?.querySelectorAll('input')).toHaveLength(3)
    await type('from', 'JFK')
    await type('to', 'LAX')
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Swap from and to"]')?.click())
    expect(input('from').value).toBe('LAX')
    expect(input('to').value).toBe('JFK')
    expect(container.querySelector('[aria-label="Passengers"]')).toBeNull()
    expect(container.querySelector('[aria-label="Seat Class"]')).toBeNull()
  })
  it('shows the active Home link, calendar destination and no notifications', () => {
    expect(container.querySelector('nav a[href="/home"][aria-current="page"]')?.textContent).toBe('Home')
    expect(container.querySelector('a[href="/calendar"]')?.textContent).toBe('Traffic Calendar')
    expect(container.querySelector('.brand')?.getAttribute('href')).toBe('/home')
    expect(container.querySelector('[aria-label="Notifications"]')).toBeNull()
  })
})
