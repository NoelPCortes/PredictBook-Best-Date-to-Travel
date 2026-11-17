import AirportCalendar from './AirportCalendar'
import type { CalendarRoute } from './AirportCalendar'

export default function HomeCalendar({ route, onClearRoute }: { route?: CalendarRoute; onClearRoute?: () => void }) {
  return <section className="home-calendar-preview" aria-labelledby="home-calendar-title">
    <h2 id="home-calendar-title">Traffic calendar</h2>
    <AirportCalendar route={route} onClearRoute={onClearRoute} />
  </section>
}
