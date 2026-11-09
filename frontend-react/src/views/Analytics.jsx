import { useEffect, useState, useCallback } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { RefreshCw, Droplets, Thermometer, Wind, ChartBar as BarChart3 } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatTime } from '../utils.js'

export default function Analytics() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await api.getReadings()
      setReadings(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="card p-6">
        <LoadingState message="Loading analytics..." />
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

  if (readings.length === 0) {
    return (
      <div className="card p-6">
        <EmptyState
          icon={BarChart3}
          message="No data available for analytics. Generate sensor readings first."
        />
      </div>
    )
  }

  // Reverse so oldest is first for chart timeline
  const chartData = [...readings]
    .slice(0, 30)
    .reverse()
    .map((r) => ({
      time: formatTime(r.created_at),
      water: r.water_level,
      temperature: r.temperature,
      gas: r.gas_level,
      status: r.status,
    }))

  const avg = (key) =>
    (chartData.reduce((s, r) => s + r[key], 0) / chartData.length).toFixed(1)
  const max = (key) => Math.max(...chartData.map((r) => r[key]))
  const min = (key) => Math.min(...chartData.map((r) => r[key]))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Sensor Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">
            Trend analysis for the latest {chartData.length} readings
          </p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={Droplets}
          label="Water Level"
          accent="blue"
          avg={avg('water')}
          min={min('water')}
          max={max('water')}
          unit="%"
        />
        <SummaryCard
          icon={Thermometer}
          label="Temperature"
          accent="amber"
          avg={avg('temperature')}
          min={min('temperature')}
          max={max('temperature')}
          unit="°C"
        />
        <SummaryCard
          icon={Wind}
          label="Gas Level"
          accent="red"
          avg={avg('gas')}
          min={min('gas')}
          max={max('gas')}
          unit="ppm"
        />
      </div>

      {/* Water level chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Water Level Trend
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#0f1e36',
                border: '1px solid #1e3a5f',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey="water"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#waterGrad)"
              name="Water Level %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Temperature chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Temperature Trend
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#0f1e36',
                border: '1px solid #1e3a5f',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#tempGrad)"
              name="Temperature °C"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gas level chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Gas Level Trend
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#0f1e36',
                border: '1px solid #1e3a5f',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey="gas"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#gasGrad)"
              name="Gas ppm"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Combined chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Combined Sensor Overview
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#0f1e36',
                border: '1px solid #1e3a5f',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="water" stroke="#3b82f6" strokeWidth={2} name="Water %" dot={false} />
            <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} name="Temp °C" dot={false} />
            <Line type="monotone" dataKey="gas" stroke="#ef4444" strokeWidth={2} name="Gas ppm" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, accent, avg, min, max, unit }) {
  const accents = {
    blue: 'text-blue-400 bg-blue-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    red: 'text-red-400 bg-red-500/10',
  }
  const a = accents[accent]

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">{label}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-slate-500 mb-1">Avg</p>
          <p className="text-lg font-bold text-white">{avg}<span className="text-xs text-slate-500 font-normal">{unit}</span></p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Min</p>
          <p className="text-lg font-bold text-green-400">{min}<span className="text-xs text-slate-500 font-normal">{unit}</span></p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Max</p>
          <p className="text-lg font-bold text-red-400">{max}<span className="text-xs text-slate-500 font-normal">{unit}</span></p>
        </div>
      </div>
    </div>
  )
}
