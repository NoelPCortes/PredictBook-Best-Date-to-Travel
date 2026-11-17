import { useCallback, useState } from 'react'
import { ApiError, fieldMessage } from '../../api/client'
import PageControls from '../../components/PageControls'
import RecordAlert from '../../components/RecordAlert'
import DeleteConfirmation from '../../components/DeleteConfirmation'
import { useRemoteResource } from '../../components/useRemoteResource'
import { getStaffList, revokeStaff } from './api'

type Removal = { email: string; username?: string; isPending: boolean }

export default function StaffLists({ refresh }: { refresh: number }) {
  const [attempt, setAttempt] = useState(0)
  const [staffPage, setStaffPage] = useState(1)
  const [pendingPage, setPendingPage] = useState(1)
  const load = useCallback(() => getStaffList(staffPage, pendingPage), [staffPage, pendingPage])
  const lists = useRemoteResource(`staff-lists/${refresh}/${attempt}/${staffPage}/${pendingPage}`, load)
  const [pending, setPending] = useState<Removal | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function remove() {
    if (!pending || isRemoving) return
    setIsRemoving(true); setError(''); setSuccess('')
    try {
      const result = await revokeStaff(pending.email)
      setSuccess(result.detail); setPending(null); setAttempt(value => value + 1)
    } catch (error) {
      setError(error instanceof ApiError ? fieldMessage(error.fields.detail) ?? fieldMessage(error.fields.non_field_errors) ?? fieldMessage(error.fields.email) ?? 'Unable to remove Staff access. Please try again.' : 'Unable to remove Staff access. Please try again.')
    } finally { setIsRemoving(false) }
  }
  function ask(target: Removal) { setPending(target); setError(''); setSuccess('') }
  return <>
    {success && <RecordAlert kind="success">{success}</RecordAlert>}
    {pending && <DeleteConfirmation key={pending.email} message={pending.isPending ? `Remove the pending Staff assignment for ${pending.email}?` : `Remove Staff access for ${pending.username}? They become a Traveler. Their account is not deleted.`} isDeleting={isRemoving} error={error} onCancel={() => { setPending(null); setError('') }} onDelete={() => { void remove() }} actionLabel="Remove" pendingLabel="Removing…" />}
    {!lists.value && !lists.error && <p role="status">Loading Staff and pending assignments…</p>}
    {lists.error && <><RecordAlert kind="error">{lists.error}</RecordAlert><button type="button" className="record-button record-secondary" onClick={() => setAttempt(value => value + 1)}>Retry lists</button></>}
    {lists.value && <>
      <section className="head-card" aria-labelledby="head-staff-title"><h2 id="head-staff-title">Staff</h2>
        <div className="record-table-scroll" role="region" tabIndex={0} aria-label="Staff table"><table className="record-table">
          <thead><tr><th scope="col">Username</th><th scope="col">Email</th><th scope="col">Actions</th></tr></thead>
          <tbody>{lists.value.staff.map(user => <tr key={user.email}><td>{user.username}</td><td>{user.email}</td><td><button type="button" className="record-button record-danger" disabled={isRemoving} onClick={() => ask({ ...user, isPending: false })}>Remove</button></td></tr>)}
            {!lists.value.staff.length && <tr><td colSpan={3}>No Staff accounts yet.</td></tr>}</tbody>
        </table></div>
        <PageControls rows={lists.value.staff} page={staffPage} onChange={setStaffPage} />
      </section>
      <section className="head-card" aria-labelledby="head-pending-title"><h2 id="head-pending-title">Pending assignments</h2>
        <div className="record-table-scroll" role="region" tabIndex={0} aria-label="Pending assignments table"><table className="record-table">
          <thead><tr><th scope="col">Email</th><th scope="col">Assigned by</th><th scope="col">Assigned on</th><th scope="col">Actions</th></tr></thead>
          <tbody>{lists.value.pending.map(row => <tr key={row.email}><td>{row.email}</td><td>{row.assigned_by_username}</td><td><time dateTime={row.assigned_at}>{new Date(row.assigned_at).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</time></td><td><button type="button" className="record-button record-danger" disabled={isRemoving} onClick={() => ask({ email: row.email, isPending: true })}>Remove</button></td></tr>)}
            {!lists.value.pending.length && <tr><td colSpan={4}>No pending assignments.</td></tr>}</tbody>
        </table></div><PageControls rows={lists.value.pending} page={pendingPage} onChange={setPendingPage} />
      </section>
    </>}
  </>
}
