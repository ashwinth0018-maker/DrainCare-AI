import { useEffect, useState, useCallback } from 'react'
import { Droplets, Thermometer, Wind, Activity, Shield as ShieldAlert, Lightbulb, RefreshCw, AlertTriangle } from 'lucide-react'
import StatusBadge from '../components/StatusBadge.jsx'
import { LoadingState, ErrorState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime, riskLevelColor, riskScoreColor, riskBarColor } from '../utils.js'

export default function ResidentStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await api.residentStatus()
      setStatus(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) {
    return <div className="card p-6"><LoadingState message="Loading drainage status..." /></div>
  }

  if (error) {
    return <div className="card p-6"><ErrorState message={error} onRetry={load} /></div>
  }

  const risk = status.risk

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">My Drainage Point</h2>
          <p className="text-sm text-slate-500 mt-1">Live status from your drainage sensor</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {status.sensor_id === null ? (
        <div className="card p-6">
          <p className="text-sm text-slate-500 text-center">No sensor readings available yet.</p>
        </div>
      ) : (
        <>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-slate-500">Sensor:</span>
              <span className="text-sm text-slate-300 font-medium">{status.sensor_id}</span>
              <span className="text-slate-700">·</span>
              <span className="text-sm text-slate-500">{status.location}</span>
              <div className="ml-auto">
                <StatusBadge status={status.status} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricTile icon={Droplets} label="Water Level" value={status.water_level} unit="%" color="text-blue-400 bg-blue-500/10" />
              <MetricTile icon={Thermometer} label="Temperature" value={status.temperature} unit="°C" color="text-amber-400 bg-amber-500/10" />
              <MetricTile icon={Wind} label="Gas Level" value={status.gas_level} unit="ppm" color="text-red-400 bg-red-500/10" />
            </div>
            <p className="text-xs text-slate-600 mt-4">
              Last updated: {formatDateTime(status.created_at)}
            </p>
          </div>

          {risk && (
            <>
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldAlert className="w-5 h-5 text-teal-400" />
                  <h3 className="text-sm font-semibold text-white">AI Risk Assessment</h3>
                </div>
                <div className="flex items-end gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Risk Score</p>
                    <p className={`text-4xl font-bold ${riskScoreColor(risk.risk_score)}`}>
                      {risk.risk_score}
                      <span className="text-lg text-slate-600 font-normal">/100</span>
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-500 mb-1">Risk Level</p>
                    <p className={`text-xl font-bold ${riskLevelColor(risk.risk_level)}`}>
                      {risk.risk_level}
                    </p>
                  </div>
                </div>
                <div className="w-full h-3 bg-navy-950/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${riskBarColor(risk.risk_score)} rounded-full transition-all duration-500`}
                    style={{ width: `${risk.risk_score}%` }}
                  />
                </div>
              </div>

              <div className="card p-5 border-l-2 border-l-teal-600/50">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-700/15 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Recommendation</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{risk.recommendation}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {status.status !== 'Normal' && (
            <div className={`card p-4 border-l-2 ${status.status === 'Critical' ? 'border-l-red-500/60' : 'border-l-amber-500/60'} flex items-start gap-3`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 ${status.status === 'Critical' ? 'text-red-400' : 'text-amber-400'}`} />
              <p className="text-sm text-slate-300">
                Your drainage point currently has a {status.status.toLowerCase()} reading. If you haven't already, submit a maintenance request.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MetricTile({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-navy-950/40 border border-navy-800/40">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
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
