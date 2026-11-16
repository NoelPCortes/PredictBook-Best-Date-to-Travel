export default function RecordAlert({ kind, children }: { kind: 'success' | 'error'; children: string }) {
  return <p className={`record-alert record-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</p>
}
