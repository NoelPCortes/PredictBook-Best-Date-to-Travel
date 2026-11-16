import type { CrowdLevel } from '../types/traffic'
import './CrowdChip.css'

function crowdLabel(level?: CrowdLevel): string {
  return level ? `${level[0]!.toUpperCase()}${level.slice(1)} crowd` : 'No data'
}

export default function CrowdChip({ level }: { level?: CrowdLevel }) {
  return <span className={`record-crowd-chip ${level ?? 'no-data'}`}><i aria-hidden="true" />{crowdLabel(level)}</span>
}
