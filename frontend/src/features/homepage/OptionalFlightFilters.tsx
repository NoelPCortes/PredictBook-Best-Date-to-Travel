import RecordField from '../../components/RecordField'
import type { OptionalFilters } from './searchFilters'

function hourLabel(hour: number, end: boolean) { return `${hour % 12 || 12}:${end ? '59' : '00'} ${hour < 12 ? 'AM' : 'PM'}` }
export default function OptionalFlightFilters({ value, onChange, errors }: { value: OptionalFilters; onChange: (filters: OptionalFilters) => void; errors: Record<string, string> }) {
  return <div className="home-optional-filters">{(['departure', 'arrival'] as const).map(prefix => <div key={prefix}>
    <RecordField name={`${prefix}_date`} type="date" label={`${prefix === 'departure' ? 'Departure' : 'Arrival'} date (optional)`} value={value[`${prefix}_date`] ?? ''} onChange={date => onChange({ ...value, [`${prefix}_date`]: date })} error={errors[`${prefix}_date`]} />
    <fieldset className="home-hours" aria-describedby={`${prefix}-hours-hint${errors[`${prefix}_hour_to`] ? ` ${prefix}-hours-error` : ''}`}>
      <legend>{prefix === 'departure' ? 'Departure' : 'Arrival'} hours (optional)</legend>
      <div className="home-hour-fields">{(['from', 'to'] as const).map(bound => {
        const field = `${prefix}_hour_${bound}` as const
        return <div className={`record-field${errors[`${prefix}_hour_to`] ? ' record-field-invalid' : ''}`} key={field}><label htmlFor={field}>{bound === 'from' ? 'From' : 'To'}</label><select id={field} name={field} value={value[field] ?? ''} onChange={event => onChange({ ...value, [field]: event.target.value })} aria-invalid={errors[`${prefix}_hour_to`] ? true : undefined} aria-describedby={`${prefix}-hours-hint${errors[`${prefix}_hour_to`] ? ` ${prefix}-hours-error` : ''}`}><option value="">Any</option>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={String(hour)}>{hourLabel(hour, bound === 'to')}</option>)}</select></div>
      })}</div>
      <p className="home-hours-hint" id={`${prefix}-hours-hint`}>Ranges that cross midnight are not supported.</p>
      {errors[`${prefix}_hour_to`] && <p className="record-field-error" id={`${prefix}-hours-error`}>{errors[`${prefix}_hour_to`]}</p>}
    </fieldset>
  </div>)}</div>
}
