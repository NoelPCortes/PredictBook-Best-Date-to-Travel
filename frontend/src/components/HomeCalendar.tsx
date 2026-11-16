import { useState } from 'react'
import { formatHomeDate, januaryDays, sampleBookingInfo } from '../data/homeSample'
import type { CrowdLevel } from '../data/homeSample'
import Icon from './Icon'

export function CrowdChip({ level }: { level: CrowdLevel }) {
  return <span className={`crowd-chip ${level.toLowerCase()}`}><i />{level} crowd</span>
}

export default function HomeCalendar() {
  const [selectedDay, setSelectedDay] = useState(14)
  const selected = januaryDays.find(({ day }) => day === selectedDay) ?? januaryDays[13]!
  const hasBookingInfo = selectedDay === sampleBookingInfo.day
  const bookings = hasBookingInfo ? sampleBookingInfo.bookings : 0
  return (
    <section className="home-calendar" aria-labelledby="home-calendar-title">
      <div className="home-calendar-month">
        <div className="home-calendar-heading">
          <h2 id="home-calendar-title">Traffic calendar</h2>
          <span className="month-label">Jan 2026<Icon name="down" /></span>
          {/* TODO: Enable month navigation when more calendar data is available. */}
          <button type="button" disabled aria-label="Previous month"><Icon name="left" /></button>
          <button type="button" disabled aria-label="Next month"><Icon name="chevron" /></button>
        </div>
        <div className="calendar-grid home-day-grid" role="group" aria-label="January 2026 crowd levels">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span className="weekday" key={day}>{day}</span>)}
          {Array.from({ length: januaryDays[0]!.date.getDay() }, (_, index) => <span aria-hidden="true" key={'blank-' + index} />)}
          {januaryDays.map(({ day, level, date }) => <button
            type="button" key={day} className={`calendar-day ${level.toLowerCase()}`}
            style={day === 1 ? { gridColumnStart: date.getDay() + 1 } : undefined}
            aria-label={`January ${day}, 2026, ${level} crowd`}
            aria-pressed={selectedDay === day} onClick={() => setSelectedDay(day)}>{day}</button>)}
        </div>
        <div className="legend">{(['Low', 'Medium', 'High'] as const).map(level => <span key={level}><i className={level.toLowerCase()} />{level}</span>)}</div>
      </div>
      <div className="booking-info" aria-live="polite" aria-atomic="true">
        <p className="booking-eyebrow">BOOKING INFORMATION</p>
        <h3>{formatHomeDate(selected.date)}</h3>
        <CrowdChip level={selected.level} />
        <dl>
          <div><dt><Icon name="plane" />Flights available</dt><dd>{hasBookingInfo ? sampleBookingInfo.flights : '—'}</dd></div>
          <div><dt><Icon name="seat" />Estimated seat availability</dt><dd>{hasBookingInfo ? sampleBookingInfo.seats : '—'}</dd></div>
          <div><dt><Icon name="calendar" />Your bookings</dt><dd>{bookings}{bookings > 0 && <Icon name="chevron" />}</dd></div>
        </dl>
      </div>
    </section>
  )
}
