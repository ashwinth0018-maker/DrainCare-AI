export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function riskLevelColor(level) {
  const map = {
    Low: 'text-green-400',
    Medium: 'text-amber-400',
    High: 'text-red-400',
  }
  return map[level] || 'text-slate-400'
}

export function riskScoreColor(score) {
  if (score >= 50) return 'text-red-400'
  if (score >= 25) return 'text-amber-400'
  return 'text-green-400'
}

export function riskBarColor(score) {
  if (score >= 50) return 'bg-red-500'
  if (score >= 25) return 'bg-amber-500'
  return 'bg-green-500'
}
