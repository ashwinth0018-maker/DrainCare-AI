import { useEffect, useState, useCallback } from 'react'
import {
  Play,
  RefreshCw,
  Droplets,
  Thermometer,
  Wind,
  Search,
  Activity,
  Plus,
} from 'lucide-react'
import StatusBadge from '../components/StatusBadge.jsx'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

export default function Monitoring({ onAnalyze, onSimulation }) {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showManual, setShowManual] = useState(false)

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

  const handleSimulate = async () => {
    setSimulating(true)
    try {
      await api.simulateReading()
      await load()
      onSimulation?.('Sensor reading simulated successfully', 'success')
    } catch (err) {
      onSimulation?.(err.message, 'error')
    } finally {
      setSimulating(false)
    }
  }

  const filtered = readings.filter((r) => {
    const matchesSearch =
      !search ||
      r.sensor_id.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="card p-6">
        <LoadingState message="Loading sensor readings..." />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Sensor Monitoring</h2>
          <p className="text-sm text-slate-500 mt-1">
            {readings.length} total readings · showing {filtered.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowManual((v) => !v)} className="btn-secondary">
            <Plus className="w-4 h-4" />
            Manual Entry
          </button>
          <button onClick={handleSimulate} disabled={simulating} className="btn-primary">
            {simulating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {simulating ? 'Simulating...' : 'Simulate'}
          </button>
        </div>
      </div>

      {/* Manual entry form */}
      {showManual && (
        <ManualEntryForm
          onClose={() => setShowManual(false)}
          onCreated={() => {
            load()
            setShowManual(false)
          }}
          onToast={onSimulation}
        />
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by sensor ID or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field sm:w-40"
        >
          <option value="all">All Statuses</option>
          <option value="Normal">Normal</option>
          <option value="Warning">Warning</option>
          <option value="Critical">Critical</option>
        </select>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Activity}
            message={
              readings.length === 0
                ? 'No sensor readings yet. Click Simulate to generate one.'
                : 'No readings match your filters.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-navy-800/50">
                  <th className="px-4 py-3 font-semibold">Sensor ID</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Water</th>
                  <th className="px-4 py-3 font-semibold">Temp</th>
                  <th className="px-4 py-3 font-semibold">Gas</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="px-4 py-3 font-medium text-slate-300">
                      {r.sensor_id}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{r.location}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-blue-400">
                        <Droplets className="w-3.5 h-3.5" />
                        {r.water_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-amber-400">
                        <Thermometer className="w-3.5 h-3.5" />
                        {r.temperature}°
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-red-400">
                        <Wind className="w-3.5 h-3.5" />
                        {r.gas_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onAnalyze?.(r.id)}
                        className="text-teal-400 hover:text-teal-300 text-xs font-medium transition-colors"
                      >
                        Analyze →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ManualEntryForm({ onClose, onCreated, onToast }) {
  const [form, setForm] = useState({
    sensor_id: '',
    location: '',
    water_level: '',
    temperature: '',
    gas_level: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.addReading({
        sensor_id: form.sensor_id,
        location: form.location,
        water_level: parseFloat(form.water_level),
        temperature: parseFloat(form.temperature),
        gas_level: parseFloat(form.gas_level),
      })
      onToast?.('Sensor reading added successfully', 'success')
      onCreated()
    } catch (err) {
      onToast?.(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-5 animate-slide-up">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">
        Add Manual Sensor Reading
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-500 font-medium">Sensor ID</label>
          <input
            type="text"
            required
            value={form.sensor_id}
            onChange={(e) => setForm({ ...form, sensor_id: e.target.value })}
            className="input-field mt-1"
            placeholder="ESP32_001"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Location</label>
          <input
            type="text"
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="input-field mt-1"
            placeholder="Building A - Drainage 01"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Water Level (0-100)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.water_level}
            onChange={(e) => setForm({ ...form, water_level: e.target.value })}
            className="input-field mt-1"
            placeholder="45.5"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Temperature (°C)</label>
          <input
            type="number"
            step="0.01"
            required
            value={form.temperature}
            onChange={(e) => setForm({ ...form, temperature: e.target.value })}
            className="input-field mt-1"
            placeholder="32.0"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Gas Level (ppm)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.gas_level}
            onChange={(e) => setForm({ ...form, gas_level: e.target.value })}
            className="input-field mt-1"
            placeholder="250"
          />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Save Reading'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
