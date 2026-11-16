// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { clearSession, setProfile } from '../src/api/authState'
import { ApiError } from '../src/api/client'
import HeadPage from '../src/features/head/HeadPage'
import { assignStaff, getHeadAccess } from '../src/features/head/api'

vi.mock('../src/features/head/api', () => ({ assignStaff: vi.fn(), getHeadAccess: vi.fn() }))
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  setProfile({ id: 1, username: 'head_user', email: 'head@example.com', first_name: '', last_name: '', role: 'head' })
  vi.mocked(getHeadAccess).mockReset().mockResolvedValue({ detail: 'Head management access granted.' })
  vi.mocked(assignStaff).mockReset().mockResolvedValue({ detail: 'Staff access assigned.' })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  clearSession()
})

async function render() {
  await act(async () => root.render(<MemoryRouter initialEntries={['/head']}><HeadPage /></MemoryRouter>))
}

function emailInput() {
  return container.querySelector<HTMLInputElement>('[name="email"]')!
}

async function submit(email = 'newstaff@example.com') {
  emailInput().value = email
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
}

it('renders Head navigation and only the approved email assignment form after server authorization', async () => {
  await render()
  expect(getHeadAccess).toHaveBeenCalledOnce()
  expect(container.querySelector('h1')?.textContent).toBe('Head management')
  expect([...container.querySelectorAll('.app-nav-links a')].map(link => link.textContent)).toEqual(['Head management', 'Dashboard'])
  expect(container.querySelector('a[aria-current="page"]')?.getAttribute('href')).toBe('/head')
  expect(container.querySelector('.brand')?.getAttribute('href')).toBe('/head')
  expect(container.querySelector('a[href="/staff/dashboard"]')).not.toBeNull()
  expect(container.querySelectorAll('input')).toHaveLength(1)
  expect(container.querySelector('label')?.textContent).toBe('Email')
  expect(emailInput().type).toBe('email')
  expect(container.textContent).toContain('head_user')
  expect(container.textContent).not.toMatch(/Promote|Remove|Charts/)
  expect(container.querySelector('svg')).toBeNull()
})

it.each(['Staff access assigned.', 'Pending Staff access assigned.', 'Account already has Staff or Head access; no change made.'])('shows the server result: %s', async detail => {
  vi.mocked(assignStaff).mockResolvedValueOnce({ detail })
  await render()
  await submit('  newstaff@example.com  ')
  expect(assignStaff).toHaveBeenCalledWith('newstaff@example.com')
  const status = container.querySelector('.head-success[role="status"]')
  expect(status?.textContent).toBe(detail)
  expect(document.activeElement).toBe(status)
})

it.each(['', 'invalid-email'])('validates email before sending: %s', async email => {
  await render()
  await submit(email)
  expect(assignStaff).not.toHaveBeenCalled()
  expect(emailInput().getAttribute('aria-invalid')).toBe('true')
  expect(emailInput().getAttribute('aria-describedby')).toBe('head-staff-email-error')
  expect(document.activeElement).toBe(emailInput())
})

it('associates backend email errors with the field and focuses it', async () => {
  vi.mocked(assignStaff).mockRejectedValueOnce(new ApiError(400, { email: ['Enter a valid email address.'] }))
  await render()
  await submit()
  expect(container.querySelector('#head-staff-email-error')?.textContent).toBe('Enter a valid email address.')
  expect(emailInput().getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(emailInput())
})

it('shows backend general errors as an alert', async () => {
  vi.mocked(assignStaff).mockRejectedValueOnce(new ApiError(400, { detail: 'Assignment could not be completed.' }))
  await render()
  await submit()
  expect(container.querySelector('.head-error[role="alert"]')?.textContent).toBe('Assignment could not be completed.')
})

it('shows an error and permits another attempt after a network failure', async () => {
  vi.mocked(assignStaff).mockRejectedValueOnce(new TypeError('Offline'))
  await render()
  await submit()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Unable to assign Staff access')
  expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false)
})

it('clears the result message when the email is edited', async () => {
  await render()
  await submit()
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(emailInput(), 'other@example.com')
    emailInput().dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(container.querySelector('.head-feedback')).toBeNull()
})

it('disables assignment while a request is pending', async () => {
  vi.mocked(assignStaff).mockReturnValueOnce(new Promise(() => {}))
  await render()
  await submit()
  expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true)
  expect(container.querySelector('form')?.getAttribute('aria-busy')).toBe('true')
  await submit()
  expect(assignStaff).toHaveBeenCalledOnce()
})

it('withholds the form while Head authorization is pending', async () => {
  vi.mocked(getHeadAccess).mockReturnValueOnce(new Promise(() => {}))
  await render()
  expect(container.querySelector('[role="status"]')?.textContent).toContain('Checking Head access')
  expect(container.querySelector('form')).toBeNull()
})

it.each([403, 500])('withholds the form when server authorization returns %s', async status => {
  vi.mocked(getHeadAccess).mockRejectedValueOnce(new ApiError(status, {}))
  await render()
  expect(container.querySelector('[role="alert"]')).not.toBeNull()
  expect(container.querySelector('form')).toBeNull()
})

it('removes the form if Head access is revoked before assignment', async () => {
  vi.mocked(assignStaff).mockRejectedValueOnce(new ApiError(403, {}))
  await render()
  await submit()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('do not have access')
  expect(container.querySelector('form')).toBeNull()
})
