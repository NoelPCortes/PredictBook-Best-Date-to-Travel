// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it } from 'vitest'
import { clearSession, setProfile } from '../src/api/authState'
import AppNavbar from '../src/components/AppNavbar'

let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement | undefined
afterEach(async () => { if (root) await act(async () => root!.unmount()); container?.remove(); clearSession() })

it.each(['/head', '/staff/dashboard', '/staff/flights', '/staff/forecasts'])('keeps all Head links visible on %s and marks the active page', async path => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  setProfile({ id: 1, username: 'head', email: 'head@example.com', role: 'head', first_name: '', last_name: '' })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  await act(async () => root!.render(<MemoryRouter initialEntries={[path]}><AppNavbar userName="head" onSignOut={() => {}} isSigningOut={false} navigation="staff" /></MemoryRouter>))
  expect([...container.querySelectorAll('.app-nav-links a')].map(link => link.textContent)).toEqual(['Dashboard', 'Flights', 'Crowd forecasts', 'Head management'])
  expect(container.querySelector('.app-nav-links a[aria-current="page"]')?.getAttribute('href')).toBe(path)
})

it.each(['staff', 'traveler'] as const)('shows only the approved navigation for %s', async role => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  setProfile({ id: 1, username: role, email: `${role}@example.com`, role, first_name: '', last_name: '' })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  await act(async () => root!.render(<MemoryRouter><AppNavbar userName={role} onSignOut={() => {}} isSigningOut={false} navigation="head" /></MemoryRouter>))
  const labels = [...container.querySelectorAll('.app-nav-links a')].map(link => link.textContent)
  expect(labels).toEqual(role === 'staff' ? ['Dashboard', 'Flights', 'Crowd forecasts'] : ['Home', 'Traffic Calendar'])
  expect(container.querySelector('a[href="/head"]')).toBeNull()
})
it.each(['traveler', 'staff', 'head'] as const)('shows the profile icon link and no top-bar sign out for %s', async role => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  setProfile({ id: 1, username: role, email: `${role}@example.com`, role, first_name: '', last_name: '' })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  await act(async () => root!.render(<MemoryRouter initialEntries={['/profile']}><AppNavbar userName={role} /></MemoryRouter>))
  const account = container.querySelector<HTMLAnchorElement>(`[aria-label="My account, ${role}"]`)!
  expect(account.getAttribute('href')).toBe('/profile')
  expect(account.getAttribute('aria-current')).toBe('page')
  expect(account.querySelector('.profile-icon-badge img')?.getAttribute('src')).toContain('UserCircleIcon')
  expect(account.querySelector('img')?.getAttribute('alt')).toBe('')
  expect(container.textContent).not.toContain('Sign out')
  account.focus(); expect(document.activeElement).toBe(account)
})
