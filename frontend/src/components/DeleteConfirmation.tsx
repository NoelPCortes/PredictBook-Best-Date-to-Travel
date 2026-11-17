import { useEffect, useId, useRef } from 'react'
import RecordAlert from './RecordAlert'

type DeleteConfirmationProps = {
  message: string
  isDeleting: boolean
  error: string
  onCancel: () => void
  onDelete: () => void
  actionLabel?: string
  pendingLabel?: string
}

export default function DeleteConfirmation({ message, isDeleting, error, onCancel, onDelete, actionLabel = 'Delete', pendingLabel = 'Deleting…' }: DeleteConfirmationProps) {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const opener = document.activeElement
    cancelRef.current?.focus()
    return () => {
      if (opener instanceof HTMLElement && opener !== document.body && opener.isConnected) opener.focus()
      else document.querySelector<HTMLElement>('.record-page h1')?.focus()
    }
  }, [])
  return <section className="record-confirmation" role="alertdialog" aria-modal="false" aria-labelledby={titleId}>
    <h2 id={titleId}>{message}</h2>
    {error && <RecordAlert kind="error">{error}</RecordAlert>}
    <div className="record-actions">
      <button ref={cancelRef} type="button" className="record-button record-ghost" onClick={onCancel} disabled={isDeleting}>Cancel</button>
      <button type="button" className="record-button record-danger" onClick={onDelete} disabled={isDeleting}>{isDeleting ? pendingLabel : actionLabel}</button>
    </div>
  </section>
}
