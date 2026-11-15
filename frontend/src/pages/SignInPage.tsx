import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import type { SampleDay } from '../components/AuthLayout'
import AuthField from '../components/AuthField'
const sampleDays: readonly SampleDay[] = [
  { day: 5, level: 'Medium' }, { day: 6, level: 'Low' },
  { day: 7, level: 'Low' }, { day: 8, level: 'Low' },
  { day: 9, level: 'Medium' }, { day: 10, level: 'High' },
  { day: 11, level: 'High' }, { day: 12, level: 'Medium' },
  { day: 13, level: 'Low' }, { day: 14, level: 'Low' },
  { day: 15, level: 'Low' }, { day: 16, level: 'Low' },
  { day: 17, level: 'Medium' }, { day: 18, level: 'High' },
]

export default function SignInPage() {
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState({ username: false, password: false })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      username: !usernameRef.current?.value.trim(),
      password: !passwordRef.current?.value,
    }
    setErrors(nextErrors)
    if (nextErrors.username) {
      usernameRef.current?.focus()
      return
    }
    if (nextErrors.password) {
      passwordRef.current?.focus()
      return
    }
    // TODO: Connect the Django sign-in API when authentication is implemented.
  }

  return (
    <AuthLayout pageId="signin" title="Welcome back"
      intro="Sign in to search flights, check airport crowd levels, and get suggested dates. Staff sign in here too."
      panelTitle="Know the crowd before you book."
      panelIntro="Low, Medium, or High, for every day of your trip." days={sampleDays}>
      <form onSubmit={handleSubmit} noValidate>
        <AuthField ref={usernameRef} id="signin-username" name="username" label="Email or username" type="text" autoComplete="username" placeholder="Enter your email or username" error={errors.username ? 'Enter your email or username.' : undefined} errorId="username-error" />
        <AuthField ref={passwordRef} id="signin-password" name="password" label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" error={errors.password ? 'Enter your password.' : undefined} errorId="password-error" />
        <button type="submit" className="button signin-submit">Sign in</button>
      </form>
      <div className="signin-divider"><span>Don’t have an account yet?</span></div>
      <Link to="/signup" className="button signin-create">Create an account</Link>
    </AuthLayout>
  )
}
