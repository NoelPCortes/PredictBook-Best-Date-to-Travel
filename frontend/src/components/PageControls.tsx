import type { Records } from '../api/pagination'

export default function PageControls({ rows, page, onChange }: { rows: Records<unknown>; page: number; onChange: (page: number) => void }) {
  if (!rows.previous && !rows.next) return null
  return <nav className="record-actions" aria-label="Results pages">
    <button type="button" className="record-button record-secondary" disabled={!rows.previous} onClick={() => onChange(page - 1)}>Previous</button>
    <span>Page {page} ? {rows.count} records</span>
    <button type="button" className="record-button record-secondary" disabled={!rows.next} onClick={() => onChange(page + 1)}>Next</button>
  </nav>
}
