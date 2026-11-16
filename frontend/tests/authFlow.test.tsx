// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../src/App'
import { clearSession } from '../src/api/authState'
import { readTokens, writeTokens } from '../src/api/authStorage'
import { ApiError, apiRequest } from '../src/api/client'
import { signup } from '../src/features/signup/api'
import { logout } from '../src/features/homepage/api'

const profile = { id: 1, username: 'traveler', email: 'traveler@example.com', first_name: '', last_name: '', role: 'traveler' }
const tokens = { access: 'test-access', refresh: 'test-refresh' }
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const fetchMock = vi.fn<typeof fetch>()

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  clearSession()
  vi.stubEnv('VITE_API_URL', 'https://api.example.test')
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  clearSession()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

async function render(path: string) {
  await act(async () => { root.render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>) })
}

function input(name: string, value: string) {
  const field = container.querySelector<HTMLInputElement>(`input[name="${name}"]`)
  if (!field) throw new Error(`Missing field ${name}`)
  field.value = value
  return field
}

async function submit() {
  await act(async () => {
    container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

function validSignup() {
  input('username', 'traveler')
  input('email', 'traveler@example.com')
  input('password', 'Test-flow-password-927!')
  input('confirmPassword', 'Test-flow-password-927!')
}

describe('connected account flows', () => {
  it('submits only allowed signup fields and navigates to sign in', async () => {
    fetchMock.mockResolvedValueOnce(response(profile, 201))
    await render('/signup')
    validSignup()
    await submit()
    const options = fetchMock.mock.calls[0][1]!
    expect(JSON.parse(options.body as string)).toEqual({ username: 'traveler', email: 'traveler@example.com', password: 'Test-flow-password-927!' })
    expect(container.querySelector('h1')?.textContent).toBe('Welcome back')
    expect(readTokens()).toBeNull()
  })

  it('signup API preserves optional names while excluding injected role fields', async () => {
    fetchMock.mockResolvedValueOnce(response(profile, 201))
    const fields = { username: 'traveler', email: profile.email, password: 'test-only', first_name: 'Ada', last_name: 'Lee', role: 'head', promoted_by: 1 }
    await signup(fields)
    const sent = JSON.parse(fetchMock.mock.calls[0][1]!.body as string)
    expect(sent.first_name).toBe('Ada')
    expect(sent.last_name).toBe('Lee')
    expect(sent).not.toHaveProperty('role')
    expect(sent).not.toHaveProperty('promoted_by')
  })

  it('links backend errors to matching fields and focuses the first invalid field', async () => {
    fetchMock.mockResolvedValueOnce(response({ email: ['Already used.'], password: ['Too short.', 'Too common.'] }, 400))
    await render('/signup')
    validSignup()
    await submit()
    const email = container.querySelector<HTMLInputElement>('[name="email"]')!
    const password = container.querySelector<HTMLInputElement>('[name="password"]')!
    expect(container.querySelector('#signup-email-error')?.textContent).toBe('Already used.')
    expect(container.querySelector('#signup-password-error')?.textContent).toBe('Too short. Too common.')
    expect(email.getAttribute('aria-describedby')).toBe('signup-email-error')
    expect(password.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(email)
  })

  it('stores signin tokens, shows the actual username on Home, and signs out', async () => {
    fetchMock.mockResolvedValueOnce(response({ ...tokens, profile }))
      .mockResolvedValueOnce(response(profile))
      .mockResolvedValueOnce(response({ detail: 'Signed out.' }))
    await render('/signin')
    input('username', profile.email)
    input('password', 'Test-flow-password-927!')
    await submit()
    expect(readTokens()).toEqual(tokens)
    expect(container.querySelector('.eyebrow')?.textContent).toBe('WELCOME BACK, TRAVELER')
    expect(container.textContent).toContain('Sample data')
    const signout = [...container.querySelectorAll('button')].find(button => button.textContent === 'Sign out')!
    await act(async () => signout.click())
    const logoutCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/logout/'))!
    expect(JSON.parse(logoutCall[1]!.body as string)).toEqual({ refresh: tokens.refresh })
    expect(readTokens()).toBeNull()
    expect(container.querySelector('h1')?.textContent).toBe('Welcome back')
  })

  it('redirects signed-out Home visitors to sign in without requesting protected data', async () => {
    await render('/home')
    expect(container.querySelector('h1')?.textContent).toBe('Welcome back')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each(['/signin', '/signup'])('redirects authenticated visitors from %s to Home', async path => {
    writeTokens(tokens)
    fetchMock.mockResolvedValue(response(profile))
    await render(path)
    expect(container.querySelector('h1')?.textContent).toBe('Search flights and check airport crowds')
  })

  it('clears tokens locally even when logout fails', async () => {
    writeTokens(tokens)
    fetchMock.mockResolvedValueOnce(response(profile)).mockRejectedValueOnce(new TypeError('Offline'))
    await render('/home')
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Sign out')!.click())
    expect(readTokens()).toBeNull()
    expect(container.querySelector('h1')?.textContent).toBe('Welcome back')
  })

  it('keeps landing public', async () => {
    await render('/')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(container.querySelector('a[href="/signin"]')).not.toBeNull()
  })

  it('shows a generic error on signin failure without storing tokens', async () => {
    fetchMock.mockResolvedValueOnce(response({ detail: 'Invalid username/email or password.' }, 401))
    await render('/signin')
    input('username', profile.username)
    input('password', 'incorrect')
    await submit()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Check your credentials')
    expect(readTokens()).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('API token refresh', () => {
  it('blacklists the rotated refresh token when logout must retry after a 401', async () => {
    writeTokens(tokens)
    const rotated = { access: 'rotated-access', refresh: 'rotated-refresh' }
    fetchMock.mockResolvedValueOnce(response({}, 401))
      .mockResolvedValueOnce(response(rotated)).mockResolvedValueOnce(response({ detail: 'Signed out.' }))
    await logout()
    expect(JSON.parse(fetchMock.mock.calls[2][1]!.body as string)).toEqual({ refresh: rotated.refresh })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('shares one refresh attempt between concurrent protected requests', async () => {
    writeTokens(tokens)
    let completeRefresh: (value: Response) => void = () => {}
    const pending = new Promise<Response>(resolve => { completeRefresh = resolve })
    fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({}, 401))
      .mockReturnValueOnce(pending).mockImplementation(() => Promise.resolve(response(profile)))
    const first = apiRequest('/api/accounts/profile/')
    const second = apiRequest('/api/accounts/profile/')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    completeRefresh(response({ access: 'rotated-access', refresh: 'rotated-refresh' }))
    await Promise.all([first, second])
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/token/refresh/'))).toHaveLength(1)
  })
  it('retries a 401 once with the rotated access token', async () => {
    writeTokens(tokens)
    const rotated = { access: 'rotated-access', refresh: 'rotated-refresh' }
    fetchMock.mockResolvedValueOnce(response({}, 401))
      .mockResolvedValueOnce(response(rotated)).mockResolvedValueOnce(response(profile))
    expect(await apiRequest('/api/accounts/profile/')).toEqual(profile)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(String(fetchMock.mock.calls[1][0])).toContain('/api/accounts/token/refresh/')
    expect(new Headers(fetchMock.mock.calls[2][1]!.headers).get('Authorization')).toBe('Bearer rotated-access')
    expect(readTokens()).toEqual(rotated)
  })

  it('clears tokens and redirects when refresh fails without looping', async () => {
    writeTokens(tokens)
    fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({}, 401))
    await render('/home')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(readTokens()).toBeNull()
    expect(container.querySelector('h1')?.textContent).toBe('Welcome back')
  })

  it('does not refresh again when the retried request also returns 401', async () => {
    writeTokens(tokens)
    fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response(tokens)).mockResolvedValueOnce(response({}, 401))
    await expect(apiRequest('/api/accounts/profile/')).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(readTokens()).toBeNull()
  })
})
