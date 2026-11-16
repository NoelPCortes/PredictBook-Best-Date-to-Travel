import { useEffect, useRef, useState } from 'react'
import { ApiError, fieldMessage } from '../api/client'

export function useRecordErrors(fieldNames: readonly string[]) {
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  useEffect(() => {
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    first?.focus()
  }, [errors])
  function clearErrors() { setErrors({}); setFormError('') }
  function showErrors(error: unknown, fallback: string) {
    if (!(error instanceof ApiError)) { setFormError(fallback); return }
    const fields: Record<string, string> = {}
    const general: string[] = []
    for (const [name, value] of Object.entries(error.fields)) {
      const message = fieldMessage(value)
      if (!message) continue
      if (fieldNames.includes(name)) fields[name] = message
      else general.push(message)
    }
    setErrors(fields)
    setFormError(general.join(' ') || (Object.keys(fields).length ? '' : fallback))
  }
  return { formRef, errors, formError, clearErrors, showErrors }
}
