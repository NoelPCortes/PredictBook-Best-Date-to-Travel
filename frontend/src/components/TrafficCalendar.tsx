type CrowdLevel = 'Low' | 'Medium' | 'High'
const levels: readonly CrowdLevel[] = ['Medium','Medium','High','High','Medium','Low','Low','Low','Medium','High','High','Medium','Low','Low','Low','Low','Medium','High','Medium','Low','Low','Low','Medium','High','High','High','Medium','Low','Low','Medium']
const suggestedDays = new Set([14, 16, 21])

export default function TrafficCalendar() {
  return <section className="calendar" aria-labelledby="calendar-title">
    <div className="calendar-heading"><h2 id="calendar-title">Traffic calendar</h2><span className="chip">Sample data</span></div>
    <div className="calendar-grid">
      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <span className="weekday" key={day}>{day}</span>)}
      {[0,1,2].map(blank => <span aria-hidden="true" key={blank} />)}
      {levels.map((level, index) => <div key={index} className={`calendar-day ${level.toLowerCase()} ${suggestedDays.has(index + 1) ? 'suggested' : ''}`}>
        <span>{index + 1}</span><span className="sr-only">: {level} crowd level</span>
        {suggestedDays.has(index + 1) && <span role="img" aria-label="Suggested date" />}
      </div>)}
    </div>
    <div className="legend">{(['Low','Medium','High'] as const).map(level => <span key={level}><i className={level.toLowerCase()} />{level}</span>)}<span><i className="outline-key" />Outlined days are suggested dates</span></div>
  </section>
}
