export default function StatusBadge({ status }) {
  const classes = {
    Normal: 'status-normal',
    Warning: 'status-warning',
    Critical: 'status-critical',
  }

  const dotColors = {
    Normal: 'bg-green-400',
    Warning: 'bg-amber-400',
    Critical: 'bg-red-400',
  }

  const cls = classes[status] || 'status-normal'
  const dot = dotColors[status] || 'bg-green-400'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}
