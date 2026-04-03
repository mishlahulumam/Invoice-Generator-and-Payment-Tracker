import { getStatusBadgeClass, getStatusLabel } from '../utils/format'

export default function StatusBadge({ status }) {
  return (
    <span className={getStatusBadgeClass(status)}>{getStatusLabel(status)}</span>
  )
}
