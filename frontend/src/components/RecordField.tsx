import type { HTMLInputTypeAttribute } from 'react'
import SearchableSelect from './SearchableSelect'
import type { SelectOption } from './SearchableSelect'

type RecordFieldProps = {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: HTMLInputTypeAttribute
  step?: string
  maxLength?: number
  placeholder?: string
  options?: SelectOption[]
  searchable?: boolean
  navy?: boolean
}

export default function RecordField({ name, label, value, onChange, error, type = 'text', step, maxLength, options, searchable, placeholder, navy }: RecordFieldProps) {
  if (searchable && options) return <SearchableSelect name={name} label={label} value={value} onChange={onChange} error={error} options={options} navy={navy} />
  const id = `record-${name}`
  const errorId = `${id}-error`
  const accessibility = { id, name, 'aria-invalid': error ? true as const : undefined, 'aria-describedby': error ? errorId : undefined }
  return <div className="record-field-group">
    <div className={`record-field${error ? ' record-field-invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {options ? <select {...accessibility} value={value} onChange={event => onChange(event.target.value)}>
        <option value="">Choose {label.toLowerCase()}</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select> : <input {...accessibility} value={value} onChange={event => onChange(event.target.value)} type={type} step={step} maxLength={maxLength} placeholder={placeholder} />}
    </div>
    {error && <p className="record-field-error" id={errorId}>{error}</p>}
  </div>
}
