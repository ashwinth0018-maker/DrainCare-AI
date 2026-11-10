import { useEffect, useState, useCallback } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

export default function AdminProgress({ onToast }) {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await api.adminWorkerProgress()
      setProgress(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <div className="card p-6"><LoadingState message="Loading worker progress..." /></div>
  if (error) return <div className="card p-6"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Worker Progress</h2>
          <p className="text-sm text-slate-500 mt-1">{progress.length} worker(s)</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {progress.length === 0 ? (
        <div className="card p-6">
          <EmptyState icon={Activity} message="No workers registered yet." />
        </div>
      ) : (
        <div className="space-y-4">
          {progress.map((wp) => (
            <div key={wp.worker.id} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-teal-700/15 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{wp.worker.full_name}</h3>
                  <p className="text-xs text-slate-500">@{wp.worker.username}</p>
                </div>
                <div className="ml-auto flex gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">{wp.total_jobs}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-teal-400">{wp.in_progress}</p>
                    <p className="text-xs text-slate-500">Active</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-400">{wp.solved}</p>
                    <p className="text-xs text-slate-500">Solved</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-400">{wp.unpaid}</p>
                    <p className="text-xs text-slate-500">Unpaid</p>
                  </div>
                </div>
              </div>

              {wp.jobs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-navy-800/50">
                        <th className="px-3 py-2 font-semibold">ID</th>
                        <th className="px-3 py-2 font-semibold">Service</th>
                        <th className="px-3 py-2 font-semibold">Location</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold">Payment</th>
                        <th className="px-3 py-2 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wp.jobs.map((j) => (
                        <tr key={j.booking_id} className="table-row">
                          <td className="px-3 py-2 text-slate-400">#{j.booking_id}</td>
                          <td className="px-3 py-2 text-slate-300">{j.service_type}</td>
                          <td className="px-3 py-2 text-slate-400">{j.location}</td>
                          <td className="px-3 py-2"><StatusBadge status={j.booking_status} /></td>
                          <td className="px-3 py-2">
                            <span className={j.payment_status === 'Paid' ? 'text-green-400' : 'text-amber-400'}>
                              {j.payment_status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-xs">{formatDateTime(j.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {wp.jobs.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-3">No jobs assigned to this worker.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    Pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    Assigned: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    'In Progress': 'bg-teal-500/15 text-teal-400 border border-teal-500/20',
    Solved: 'bg-green-500/15 text-green-400 border border-green-500/20',
  }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || map.Pending}`}>
      {status}
    </span>
  )
}
