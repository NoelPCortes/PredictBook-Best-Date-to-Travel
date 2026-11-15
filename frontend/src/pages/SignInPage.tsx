import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand'
import './SignInPage.css'

type CrowdLevel = 'Low' | 'Medium' | 'High'
const sampleDays: readonly { day: number; level: CrowdLevel }[] = [
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
    <main className="signin-page">
      <section className="signin-half" aria-labelledby="signin-title">
        <header className="signin-brand"><Brand /></header>
        <div className="signin-content">
          <h1 id="signin-title">Welcome back</h1>
          <p className="signin-intro">Sign in to search flights, check airport crowd levels, and get suggested dates. Staff sign in here too.</p>
          <form onSubmit={handleSubmit} noValidate>
            <div className="signin-field-group">
              <div className="signin-field">
                <label htmlFor="signin-username">Email or username</label>
                <input ref={usernameRef} id="signin-username" name="username" type="text" autoComplete="username" placeholder="Enter your email or username" aria-invalid={errors.username || undefined} aria-describedby={errors.username ? 'username-error' : undefined} />
              </div>
              {errors.username && <p id="username-error" className="signin-error" role="alert">Enter your email or username.</p>}
            </div>
            <div className="signin-field-group">
              <div className="signin-field">
                <label htmlFor="signin-password">Password</label>
                <input ref={passwordRef} id="signin-password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" aria-invalid={errors.password || undefined} aria-describedby={errors.password ? 'password-error' : undefined} />
              </div>
              {errors.password && <p id="password-error" className="signin-error" role="alert">Enter your password.</p>}
            </div>
            <button type="submit" className="button signin-submit">Sign in</button>
          </form>
          <div className="signin-divider"><span>Don’t have an account yet?</span></div>
          <Link to="/signup" className="button signin-create">Create an account</Link>
        </div>
      </section>
      <section className="signin-panel" aria-labelledby="signin-panel-title">
        <div className="signin-panel-content">
          <p className="eyebrow">BEST DATE TO TRAVEL</p>
          <h2 id="signin-panel-title">Know the crowd before you book.</h2>
          <p className="signin-panel-intro">Low, Medium, or High, for every day of your trip.</p>
          <div className="signin-calendar" role="group" aria-label="Sample crowd levels">
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span className="weekday" key={day}>{day}</span>)}
              {sampleDays.map(({ day, level }) => (
                <div className={`calendar-day ${level.toLowerCase()}`} key={day}>
                  {day}<span className="sr-only">: {level} crowd level</span>
                </div>
              ))}
            </div>
            <p className="signin-sample-caption">Sample data</p>
          </div>
        </div>
      </section>
    </main>
  )
}
