import { useEffect, useState, useCallback } from 'react'
import { Wrench, RefreshCw, UserCheck, Loader as Loader2 } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

export default function AdminRequests({ onToast }) {
  const [requests, setRequests] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assigningId, setAssigningId] = useState(null)
  const [selectedWorker, setSelectedWorker] = useState({})

  const load = useCallback(async () => {
    try {
      setError(null)
      const [reqData, workerData] = await Promise.all([
        api.adminMaintenanceRequests(),
        api.adminWorkers(),
      ])
      setRequests(reqData)
      setWorkers(workerData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleAssign = async (bookingId) => {
    const workerId = selectedWorker[bookingId]
    if (!workerId) {
      onToast?.('Please select a worker first', 'error')
      return
    }
    setAssigningId(bookingId)
    try {
      const result = await api.adminAssignWorker(bookingId, parseInt(workerId))
      onToast?.(result.message, 'success')
      await load()
    } catch (err) {
      onToast?.(err.message, 'error')
    } finally {
      setAssigningId(null)
    }
  }

  if (loading) return <div className="card p-6"><LoadingState message="Loading maintenance requests..." /></div>
  if (error) return <div className="card p-6"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Maintenance Requests</h2>
          <p className="text-sm text-slate-500 mt-1">{requests.length} active request(s)</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="card p-6">
          <EmptyState icon={Wrench} message="No active maintenance requests." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((r) => (
            <div key={r.booking_id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-slate-600">Request #{r.booking_id}</span>
                  <h4 className="text-sm font-semibold text-white mt-0.5">{r.service_type}</h4>
                </div>
                <StatusBadge status={r.booking_status} />
              </div>
              <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                <p><span className="text-slate-600">Customer:</span> {r.customer_name}</p>
                <p><span className="text-slate-600">Phone:</span> {r.phone}</p>
                <p><span className="text-slate-600">Location:</span> {r.location}</p>
                <p><span className="text-slate-600">Date:</span> {formatDateTime(r.created_at)}</p>
                <p>
                  <span className="text-slate-600">Payment:</span>{' '}
                  <span className={r.payment_status === 'Paid' ? 'text-green-400' : 'text-amber-400'}>
                    {r.payment_status}
                  </span>
                </p>
              </div>

              {r.booking_status === 'Pending' ? (
                <div className="pt-3 border-t border-navy-800/50 space-y-2">
                  <label className="text-xs text-slate-500 font-medium">Assign to Worker</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedWorker[r.booking_id] || ''}
                      onChange={(e) => setSelectedWorker({ ...selectedWorker, [r.booking_id]: e.target.value })}
                      className="input-field flex-1"
                    >
                      <option value="">Select worker...</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>{w.full_name} (@{w.username})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(r.booking_id)}
                      disabled={assigningId === r.booking_id}
                      className="btn-primary"
                    >
                      {assigningId === r.booking_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><UserCheck className="w-4 h-4" /> Assign</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-navy-800/50">
                  <p className="text-xs text-slate-500">
                    {r.assigned_worker_id
                      ? `Assigned to worker #${r.assigned_worker_id}`
                      : 'Status: ' + r.booking_status}
                  </p>
                </div>
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
