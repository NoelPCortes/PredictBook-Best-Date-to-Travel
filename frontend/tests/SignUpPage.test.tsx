// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import SignUpPage from '../src/pages/SignUpPage'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => root.render(<MemoryRouter><SignUpPage /></MemoryRouter>))
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})
function input(name: string): HTMLInputElement {
  const field = container.querySelector<HTMLInputElement>(`input[name="${name}"]`)
  if (!field) throw new Error('Missing input: ' + name)
  return field
}
async function submit() {
  const form = container.querySelector('form')
  if (!form) throw new Error('Missing form')
  const event = new Event('submit', { bubbles: true, cancelable: true })
  await act(async () => { form.dispatchEvent(event) })
  expect(event.defaultPrevented).toBe(true)
}
function fillValid() {
  input('username').value = 'traveler'
  input('email').value = 'traveler@example.com'
  input('password').value = 'a'
  input('confirmPassword').value = 'a'
}
describe('Sign-up page', () => {
  it('renders its heading, four labeled fields and submit button', () => {
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('h1')?.textContent).toBe('Create your account')
    expect(container.querySelectorAll('input')).toHaveLength(4)
    for (const [name, label, autocomplete] of [
      ['username', 'Username', 'username'], ['email', 'Email', 'email'],
      ['password', 'Password', 'new-password'], ['confirmPassword', 'Confirm password', 'new-password'],
    ]) {
      expect(container.querySelector(`label[for="${input(name).id}"]`)?.textContent).toBe(label)
      expect(input(name).autocomplete).toBe(autocomplete)
    }
    expect(input('email').type).toBe('email')
    expect(input('password').type).toBe('password')
    expect(input('confirmPassword').type).toBe('password')
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe('Create account')
  })
  it('links Sign in to /signin and the brand to /', () => {
    expect(container.querySelector('a[href="/signin"]')?.textContent).toBe('Sign in')
    expect(container.querySelector('a.brand')?.getAttribute('href')).toBe('/')
  })
  it('shows four required errors and focuses the first invalid field', async () => {
    await submit()
    const messages = ['Choose a username.', 'Enter your email.', 'Create a password.', 'Confirm your password.']
    expect([...container.querySelectorAll('[role="alert"]')].map(element => element.textContent)).toEqual(messages)
    for (const name of ['username', 'email', 'password', 'confirmPassword']) {
      expect(input(name).getAttribute('aria-invalid')).toBe('true')
      expect(input(name).getAttribute('aria-describedby')).toBe('signup-' + name + '-error')
    }
    expect(document.activeElement).toBe(input('username'))
  })
  it('rejects an invalid email and focuses it', async () => {
    fillValid()
    input('email').value = 'not-an-email'
    await submit()
    expect(container.querySelector('[role="alert"]')?.textContent).toBe('Enter a valid email address.')
    expect(document.activeElement).toBe(input('email'))
  })
  it('rejects mismatched passwords', async () => {
    fillValid()
    input('confirmPassword').value = 'different'
    await submit()
    expect(container.querySelector('[role="alert"]')?.textContent).toBe('Passwords do not match.')
    expect(document.activeElement).toBe(input('confirmPassword'))
  })
  it('clears only the edited field error', async () => {
    await submit()
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input('username'), 'traveler')
      input('username').dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(input('username').hasAttribute('aria-invalid')).toBe(false)
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(3)
  })
  it('accepts matching single-character passwords without extra rules', async () => {
    fillValid()
    await submit()
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0)
  })
})

