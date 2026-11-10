import { useEffect, useState, useCallback } from 'react'
import { Bell, Triangle as AlertTriangle, CircleCheck as CheckCircle, RefreshCw } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

export default function ResidentAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await api.residentAlerts()
      setAlerts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) return <div className="card p-6"><LoadingState message="Loading alerts..." /></div>
  if (error) return <div className="card p-6"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">My Alerts</h2>
          <p className="text-sm text-slate-500 mt-1">{alerts.length} active alert(s)</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="card p-6">
          <EmptyState icon={CheckCircle} message="No active alerts. Your drainage system is operating normally." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => {
            const isCritical = alert.level === 'Critical'
            return (
              <div
                key={alert.id}
                className={`card p-5 border-l-4 ${isCritical ? 'border-l-red-500/60' : 'border-l-amber-500/60'}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                    <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <span className={`text-sm font-bold ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                      {alert.level}
                    </span>
                    <p className="text-sm text-slate-300 mt-1">{alert.message}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-500">
                  <p>{alert.location}</p>
                  <p>{alert.sensor_id} · {formatDateTime(alert.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
