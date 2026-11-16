import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import type { SampleDay } from '../../components/AuthLayout'
import AuthField from '../../components/AuthField'
import { signin } from './api'
import { writeTokens } from '../../api/authStorage'
import { setProfile } from '../../api/authState'

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
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState({ username: false, password: false })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    setServerError('')
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
    setIsSubmitting(true)
    try {
      const result = await signin(usernameRef.current!.value.trim(), passwordRef.current!.value)
      writeTokens({ access: result.access, refresh: result.refresh })
      setProfile(result.profile)
      navigate('/home', { replace: true })
    } catch {
      setServerError('Unable to sign in. Check your credentials and try again.')
      requestAnimationFrame(() => errorRef.current?.focus())
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout pageId="signin" title="Welcome back"
      intro="Sign in to search flights, check airport crowd levels, and get suggested dates. Staff sign in here too."
      panelTitle="Know the crowd before you book."
      panelIntro="Low, Medium, or High, for every day of your trip." days={sampleDays}>
      <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        {serverError && <p ref={errorRef} tabIndex={-1} className="signin-error" role="alert">{serverError}</p>}
        <AuthField ref={usernameRef} id="signin-username" name="username" label="Email or username" type="text" autoComplete="username" placeholder="Enter your email or username" error={errors.username ? 'Enter your email or username.' : undefined} errorId="username-error" />
        <AuthField ref={passwordRef} id="signin-password" name="password" label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" error={errors.password ? 'Enter your password.' : undefined} errorId="password-error" />
        <button type="submit" className="button signin-submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in?' : 'Sign in'}</button>
      </form>
      <div className="signin-divider"><span>Don’t have an account yet?</span></div>
      <Link to="/signup" className="button signin-create">Create an account</Link>
    </AuthLayout>
  )
}
