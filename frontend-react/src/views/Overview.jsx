import { useEffect, useState, useCallback } from 'react'
import { Activity, Droplets, Thermometer, Wind, Triangle as AlertTriangle, Bell, Play, RefreshCw } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

export default function Overview({ onNavigate, onSimulation }) {
  const [readings, setReadings] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [simulating, setSimulating] = useState(false)

  const load = useCallback(async () => {
    try {
      setError(null)
      const [readingData, alertData] = await Promise.all([
        api.getReadings(),
        api.getAlerts(),
      ])
      setReadings(readingData)
      setAlerts(alertData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSimulate = async () => {
    setSimulating(true)
    try {
      await api.simulateReading()
      await load()
      onSimulation?.('New sensor reading generated', 'success')
    } catch (err) {
      onSimulation?.(err.message, 'error')
    } finally {
      setSimulating(false)
    }
  }

  const latest = readings[0]
  const criticalCount = alerts.filter((a) => a.level === 'Critical').length
  const warningCount = alerts.filter((a) => a.level === 'Warning').length

  if (loading) {
    return (
      <div className="card p-6">
        <LoadingState message="Loading dashboard data..." />
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time drainage monitoring summary
          </p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="btn-primary"
        >
          {simulating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {simulating ? 'Simulating...' : 'Generate Reading'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Total Readings"
          value={readings.length}
          sublabel="All sensor data points"
          accent="teal"
        />
        <StatCard
          icon={Droplets}
          label="Latest Water Level"
          value={latest ? latest.water_level : '—'}
          sublabel={latest ? latest.location : 'No data yet'}
          accent="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={alerts.length}
          sublabel={`${criticalCount} critical · ${warningCount} warning`}
          accent={criticalCount > 0 ? 'red' : 'amber'}
        />
        <StatCard
          icon={Activity}
          label="System Condition"
          value={latest ? latest.status : '—'}
          sublabel={latest ? formatDateTime(latest.created_at) : ''}
          accent={
            latest?.status === 'Critical'
              ? 'red'
              : latest?.status === 'Warning'
                ? 'amber'
                : 'green'
          }
        />
      </div>

      {/* Latest reading details */}
      {latest && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Latest Sensor Reading
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricTile
              icon={Droplets}
              label="Water Level"
              value={latest.water_level}
              unit="%"
              accent="blue"
            />
            <MetricTile
              icon={Thermometer}
              label="Temperature"
              value={latest.temperature}
              unit="°C"
              accent="amber"
            />
            <MetricTile
              icon={Wind}
              label="Gas Level"
              value={latest.gas_level}
              unit="ppm"
              accent="red"
            />
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-navy-800/50">
            <span className="text-sm text-slate-500">Sensor:</span>
            <span className="text-sm text-slate-300 font-medium">
              {latest.sensor_id}
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-sm text-slate-500">{latest.location}</span>
            <div className="ml-auto">
              <StatusBadge status={latest.status} />
            </div>
          </div>
        </div>
      )}

      {/* Recent readings + alerts preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent readings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Recent Readings
            </h3>
            <button
              onClick={() => onNavigate('monitoring')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium"
            >
              View All →
            </button>
          </div>
          {readings.length === 0 ? (
            <EmptyState icon={Activity} message="No readings yet. Generate one to start." />
          ) : (
            <div className="space-y-2">
              {readings.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-navy-800/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-navy-800/60 flex items-center justify-center shrink-0">
                    <Droplets className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200 truncate">
                      {r.location}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(r.created_at)}
                    </p>
                  </div>
                  <span className="text-sm text-slate-400 font-medium">
                    {r.water_level}%
                  </span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active alerts preview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Active Alerts
            </h3>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium"
            >
              View All →
            </button>
          </div>
          {alerts.length === 0 ? (
            <EmptyState icon={Bell} message="No active alerts. System is normal." />
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 py-2.5 px-3 rounded-lg border-l-2 ${
                    a.level === 'Critical'
                      ? 'bg-red-500/5 border-red-500/50'
                      : 'bg-amber-500/5 border-amber-500/50'
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      a.level === 'Critical' ? 'text-red-400' : 'text-amber-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200 truncate">
                      {a.location}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {a.sensor_id} · {formatDateTime(a.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricTile({ icon: Icon, label, value, unit, accent }) {
  const accents = {
    blue: 'text-blue-400 bg-blue-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    red: 'text-red-400 bg-red-500/10',
  }
  const a = accents[accent] || accents.blue

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-navy-950/40 border border-navy-800/40">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${a}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-white">
          {value}
          <span className="text-sm text-slate-500 font-normal ml-1">{unit}</span>
        </p>
      </div>
    </div>
  )
}
