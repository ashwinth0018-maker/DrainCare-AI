import { useEffect, useState, useCallback } from 'react'
import { Activity, Droplets, AlertTriangle, Wrench, CreditCard, RefreshCw } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { LoadingState, ErrorState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

export default function AdminDashboard({ onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const d = await api.adminDashboard()
      setData(d)
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

  if (loading) return <div className="card p-6"><LoadingState message="Loading admin dashboard..." /></div>
  if (error) return <div className="card p-6"><ErrorState message={error} onRetry={load} /></div>

  const d = data
  const latest = d.latest_reading

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Admin Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Overview of drainage monitoring and maintenance</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Readings" value={d.total_readings} sublabel="All sensor data points" accent="teal" />
        <StatCard icon={AlertTriangle} label="Active Alerts" value={d.active_alerts} sublabel={`${d.critical_alerts} critical`} accent={d.critical_alerts > 0 ? 'red' : 'amber'} />
        <StatCard icon={Wrench} label="Total Bookings" value={d.total_bookings} sublabel={`${d.pending_bookings} pending`} accent="blue" />
        <StatCard icon={CreditCard} label="Unpaid" value={d.unpaid_bookings} sublabel="Pending payments" accent={d.unpaid_bookings > 0 ? 'amber' : 'green'} />
      </div>

      {latest && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Latest Sensor Reading</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricTile icon={Droplets} label="Water Level" value={latest.water_level} unit="%" color="text-blue-400 bg-blue-500/10" />
            <MetricTile icon={Droplets} label="Temperature" value={latest.temperature} unit="°C" color="text-amber-400 bg-amber-500/10" />
            <MetricTile icon={Droplets} label="Gas Level" value={latest.gas_level} unit="ppm" color="text-red-400 bg-red-500/10" />
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-navy-800/50">
            <span className="text-sm text-slate-500">{latest.sensor_id} · {latest.location}</span>
            <div className="ml-auto">
              <StatusBadge status={latest.status} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Booking Status</h3>
          <div className="space-y-3">
            <StatusBar label="Pending" count={d.pending_bookings} total={d.total_bookings} color="bg-amber-500" />
            <StatusBar label="Assigned" count={d.assigned_bookings} total={d.total_bookings} color="bg-blue-500" />
            <StatusBar label="In Progress" count={d.in_progress_bookings} total={d.total_bookings} color="bg-teal-500" />
            <StatusBar label="Solved" count={d.solved_bookings} total={d.total_bookings} color="bg-green-500" />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <button onClick={() => onNavigate('admin-requests')} className="w-full text-left p-3 rounded-lg bg-navy-950/40 hover:bg-navy-800/40 transition-colors flex items-center gap-3">
              <Wrench className="w-5 h-5 text-teal-400" />
              <div>
                <p className="text-sm text-slate-200 font-medium">Maintenance Requests</p>
                <p className="text-xs text-slate-500">{d.pending_bookings} pending assignment</p>
              </div>
            </button>
            <button onClick={() => onNavigate('admin-progress')} className="w-full text-left p-3 rounded-lg bg-navy-950/40 hover:bg-navy-800/40 transition-colors flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-200 font-medium">Worker Progress</p>
                <p className="text-xs text-slate-500">Monitor worker job status and payments</p>
              </div>
            </button>
          </div>
        </div>
      </div>
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
        <p className="text-xl font-bold text-white">{value}<span className="text-sm text-slate-500 font-normal ml-1">{unit}</span></p>
      </div>
    </div>
  )
}

function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-xs text-slate-500">{count} ({pct}%)</span>
      </div>
      <div className="w-full h-2 bg-navy-950/60 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
