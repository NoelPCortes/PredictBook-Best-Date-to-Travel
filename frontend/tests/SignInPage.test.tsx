// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SignInPage from '../src/features/signin/SignInPage'

vi.mock('../src/features/signin/api', () => ({ signin: vi.fn().mockResolvedValue({ access: 'test-access', refresh: 'test-refresh', profile: { id: 1, username: 'traveler', email: 'traveler@example.com', first_name: '', last_name: '', role: 'traveler' } }) }))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<MemoryRouter><SignInPage /></MemoryRouter>)
  })
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

function input(name: string): HTMLInputElement {
  const field = container.querySelector<HTMLInputElement>(`input[name="${name}"]`)
  if (!field) throw new Error(`Missing input: ${name}`)
  return field
}

async function submit() {
  await act(async () => {
    container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

describe('Sign-in page', () => {
  it('renders Welcome back as its only main heading', () => {
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('h1')?.textContent).toBe('Welcome back')
  })

  it('renders labeled credentials and the submit button', () => {
    expect(container.querySelector('label[for="signin-username"]')?.textContent).toBe('Email or username')
    expect(input('username').autocomplete).toBe('username')
    expect(container.querySelector('label[for="signin-password"]')?.textContent).toBe('Password')
    expect(input('password').type).toBe('password')
    expect(input('password').autocomplete).toBe('current-password')
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe('Sign in')
  })

  it('links account creation to /signup and the brand to /', () => {
    expect(container.querySelector('a[href="/signup"]')?.textContent).toBe('Create an account')
    expect(container.querySelector('a.brand')?.getAttribute('href')).toBe('/')
  })

  it('shows both errors on empty submission and focuses the username', async () => {
    await submit()
    expect(container.querySelector('#username-error')?.textContent).toBe('Enter your email or username.')
    expect(container.querySelector('#password-error')?.textContent).toBe('Enter your password.')
    expect(input('username').getAttribute('aria-invalid')).toBe('true')
    expect(input('username').getAttribute('aria-describedby')).toBe('username-error')
    expect(input('password').getAttribute('aria-invalid')).toBe('true')
    expect(input('password').getAttribute('aria-describedby')).toBe('password-error')
    expect(document.activeElement).toBe(input('username'))
  })

  it('focuses the password when only it is missing, then clears errors on valid submission', async () => {
    input('username').value = 'traveler'
    await submit()
    expect(container.querySelector('#username-error')).toBeNull()
    expect(document.activeElement).toBe(input('password'))
    input('password').value = 'sample-password'
    await submit()
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0)
    expect(input('password').hasAttribute('aria-invalid')).toBe(false)
  })
})
