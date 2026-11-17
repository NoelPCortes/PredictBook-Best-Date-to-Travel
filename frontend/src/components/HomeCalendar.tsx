import AirportCalendar from './AirportCalendar'

export default function HomeCalendar() {
  return <section className="home-calendar-preview" aria-labelledby="home-calendar-title">
    <h2 id="home-calendar-title">Traffic calendar</h2>
    <AirportCalendar />
  </section>
}
