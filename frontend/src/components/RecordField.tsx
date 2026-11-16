import type { HTMLInputTypeAttribute } from 'react'

type RecordFieldProps = {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: HTMLInputTypeAttribute
  step?: string
  maxLength?: number
  options?: { value: string; label: string }[]
}

export default function RecordField({ name, label, value, onChange, error, type = 'text', step, maxLength, options }: RecordFieldProps) {
  const id = `record-${name}`
  const errorId = `${id}-error`
  const accessibility = { id, name, 'aria-invalid': error ? true as const : undefined, 'aria-describedby': error ? errorId : undefined }
  return <div className="record-field-group">
    <div className={`record-field${error ? ' record-field-invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {options ? <select {...accessibility} value={value} onChange={event => onChange(event.target.value)}>
        <option value="">Choose {label.toLowerCase()}</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select> : <input {...accessibility} value={value} onChange={event => onChange(event.target.value)} type={type} step={step} maxLength={maxLength} />}
    </div>
    {error && <p className="record-field-error" id={errorId}>{error}</p>}
  </div>
}
