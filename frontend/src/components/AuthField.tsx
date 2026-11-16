import type { InputHTMLAttributes, Ref } from 'react'

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  error?: string
  errorId: string
  ref?: Ref<HTMLInputElement>
}

export default function AuthField({ id, label, error, errorId, ref, ...inputProps }: AuthFieldProps) {
  return (
    <div className="signin-field-group">
      <div className="signin-field">
        <label htmlFor={id}>{label}</label>
        <input {...inputProps} ref={ref} id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} />
      </div>
      {error && <p id={errorId} className="signin-error" role="alert">{error}</p>}
    </div>
  )
}
