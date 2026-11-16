import type { ReactNode } from 'react'
import Brand from './Brand'
import './AuthLayout.css'

export type SampleDay = Readonly<{ day: number; level: 'Low' | 'Medium' | 'High' }>

type AuthLayoutProps = {
  title: string
  intro: string
  panelTitle: string
  panelIntro: string
  days: readonly SampleDay[]
  children: ReactNode
  pageId: string
}

export default function AuthLayout({ title, intro, panelTitle, panelIntro, days, children, pageId }: AuthLayoutProps) {
  return (
    <main className="signin-page">
      <section className="signin-half" aria-labelledby={pageId + '-title'}>
        <header className="signin-brand"><Brand /></header>
        <div className="signin-content">
          <h1 id={pageId + '-title'}>{title}</h1>
          <p className="signin-intro">{intro}</p>
          {children}
        </div>
      </section>
      <section className="signin-panel" aria-labelledby={pageId + '-panel-title'}>
        <div className="signin-panel-content">
          <p className="eyebrow">BEST DATE TO TRAVEL</p>
          <h2 id={pageId + '-panel-title'}>{panelTitle}</h2>
          <p className="signin-panel-intro">{panelIntro}</p>
          <div className="signin-calendar" role="group" aria-label="Sample crowd levels">
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span className="weekday" key={day}>{day}</span>)}
              {days.map(({ day, level }) => (
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
