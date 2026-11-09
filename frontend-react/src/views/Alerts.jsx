import { useEffect, useState, useCallback } from 'react'
import { Triangle as AlertTriangle, Bell, CircleCheck as CheckCircle, RefreshCw, MapPin, Cpu, Clock } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

export default function Alerts({ onSimulation }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [includeResolved, setIncludeResolved] = useState(false)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await api.getAlerts(includeResolved)
      setAlerts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [includeResolved])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="card p-6">
        <LoadingState message="Loading alerts..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  const criticalCount = alerts.filter((a) => a.level === 'Critical').length
  const warningCount = alerts.filter((a) => a.level === 'Warning').length
  const resolvedCount = alerts.filter((a) => a.is_resolved).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Active Alerts</h2>
          <p className="text-sm text-slate-500 mt-1">
            {alerts.length} alert(s) · {criticalCount} critical · {warningCount} warning
            {includeResolved && ` · ${resolvedCount} resolved`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includeResolved}
              onChange={(e) => setIncludeResolved(e.target.checked)}
              className="w-4 h-4 rounded accent-teal-600"
            />
            Show Resolved
          </label>
          <button onClick={load} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Alert cards */}
      {alerts.length === 0 ? (
        <div className="card p-6">
          <EmptyState
            icon={CheckCircle}
            message="No active alerts. All drainage systems are operating normally."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  )
}

function AlertCard({ alert }) {
  const isCritical = alert.level === 'Critical'
  const isResolved = alert.is_resolved

  return (
    <div
      className={`card p-5 border-l-4 transition-all duration-300 hover:shadow-lg ${
        isResolved
          ? 'border-l-green-500/40 opacity-60'
          : isCritical
            ? 'border-l-red-500/60'
            : 'border-l-amber-500/60'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isResolved
                ? 'bg-green-500/10'
                : isCritical
                  ? 'bg-red-500/10'
                  : 'bg-amber-500/10'
            }`}
          >
            {isResolved ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertTriangle
                className={`w-5 h-5 ${isCritical ? 'text-red-400' : 'text-amber-400'}`}
              />
            )}
          </div>
          <div>
            <span
              className={`text-sm font-bold ${
                isResolved
                  ? 'text-green-400'
                  : isCritical
                    ? 'text-red-400'
                    : 'text-amber-400'
              }`}
            >
              {alert.level}
            </span>
            {isResolved && (
              <span className="ml-2 text-xs text-green-400/70 font-medium">
                Resolved
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-slate-600">#{alert.id}</span>
      </div>

      <p className="text-sm text-slate-300 mb-3 leading-relaxed">
        {alert.message}
      </p>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          {alert.location}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Cpu className="w-3.5 h-3.5" />
          {alert.sensor_id}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          {formatDateTime(alert.created_at)}
          {isResolved && alert.resolved_at && (
            <span className="text-green-400/70">
              · Resolved {formatDateTime(alert.resolved_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
