import { Link } from 'react-router-dom'

export default function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="logo-mark" aria-hidden="true"><i /><i /><i /></span>
      PredictBook
    </Link>
  )
}
