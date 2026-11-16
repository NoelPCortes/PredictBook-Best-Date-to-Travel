import type { CrowdLevel } from '../data/homeSample'
import AirportCalendar from './AirportCalendar'

export function CrowdChip({ level }: { level: CrowdLevel }) {
  return <span className={`crowd-chip ${level.toLowerCase()}`}><i aria-hidden="true" />{level} crowd</span>
}

export default function HomeCalendar() {
  return <section className="home-calendar-preview" aria-labelledby="home-calendar-title">
    <h2 id="home-calendar-title">Traffic calendar</h2>
    <AirportCalendar />
  </section>
}
