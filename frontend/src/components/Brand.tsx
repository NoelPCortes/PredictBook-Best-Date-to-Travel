import { Link } from 'react-router-dom'

export default function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link className="brand" to={to}>
      <span className="logo-mark" aria-hidden="true"><i /><i /><i /></span>
      PredictBook
    </Link>
  )
}

