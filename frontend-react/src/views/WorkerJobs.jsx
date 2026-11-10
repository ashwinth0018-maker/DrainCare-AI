import { useEffect, useState, useCallback } from 'react'
import { Wrench, CheckCircle, Loader as Loader2, Clock, MapPin, RefreshCw } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

export default function WorkerJobs({ onToast }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actingId, setActingId] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await api.workerJobs()
      setJobs(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const doAction = async (id, action, label) => {
    setActingId(id)
    try {
      let result
      if (action === 'accept') result = await api.workerAcceptJob(id)
      else if (action === 'progress') result = await api.workerStartProgress(id)
      else if (action === 'solve') result = await api.workerSolveJob(id)
      onToast?.(result.message, 'success')
      await load()
    } catch (err) {
      onToast?.(err.message, 'error')
    } finally {
      setActingId(null)
    }
  }

  if (loading) return <div className="card p-6"><LoadingState message="Loading your assigned jobs..." /></div>
  if (error) return <div className="card p-6"><ErrorState message={error} onRetry={load} /></div>

  const assigned = jobs.filter((j) => j.booking_status === 'Assigned')
  const inProgress = jobs.filter((j) => j.booking_status === 'In Progress')
  const solved = jobs.filter((j) => j.booking_status === 'Solved')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">My Assigned Jobs</h2>
          <p className="text-sm text-slate-500 mt-1">
            {assigned.length} to accept · {inProgress.length} in progress · {solved.length} solved
          </p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="card p-6">
          <EmptyState icon={Wrench} message="No jobs assigned to you yet. Check back later." />
        </div>
      ) : (
        <>
          {assigned.length > 0 && (
            <JobSection title="To Accept" jobs={assigned} actingId={actingId} onAction={doAction} />
          )}
          {inProgress.length > 0 && (
            <JobSection title="In Progress" jobs={inProgress} actingId={actingId} onAction={doAction} />
          )}
          {solved.length > 0 && (
            <JobSection title="Solved" jobs={solved} actingId={actingId} onAction={doAction} />
          )}
        </>
      )}
    </div>
  )
}

function JobSection({ title, jobs, actingId, onAction }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((j) => (
          <div key={j.booking_id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs text-slate-600">Job #{j.booking_id}</span>
                <h4 className="text-sm font-semibold text-white mt-0.5">{j.service_type}</h4>
              </div>
              <StatusBadge status={j.booking_status} />
            </div>
            <div className="space-y-1.5 text-xs text-slate-500 mb-4">
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {j.location}</p>
              <p><span className="text-slate-600">Customer:</span> {j.customer_name}</p>
              <p><span className="text-slate-600">Phone:</span> {j.phone}</p>
              <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDateTime(j.created_at)}</p>
              <p>
                <span className="text-slate-600">Payment:</span>{' '}
                <span className={j.payment_status === 'Paid' ? 'text-green-400' : 'text-amber-400'}>
                  {j.payment_status}
                </span>
              </p>
            </div>
            <div className="pt-3 border-t border-navy-800/50 flex gap-2">
              {j.booking_status === 'Assigned' && (
                <button
                  onClick={() => onAction(j.booking_id, 'accept', 'Accept')}
                  disabled={actingId === j.booking_id}
                  className="btn-primary flex-1 justify-center"
                >
                  {actingId === j.booking_id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />...</>
                  ) : (
                    <>Accept Job</>
                  )}
                </button>
              )}
              {j.booking_status === 'In Progress' && (
                <button
                  onClick={() => onAction(j.booking_id, 'solve', 'Mark Solved')}
                  disabled={actingId === j.booking_id}
                  className="btn-primary flex-1 justify-center"
                >
                  {actingId === j.booking_id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Mark Solved</>
                  )}
                </button>
              )}
              {j.booking_status === 'Solved' && (
                <p className="text-xs text-green-400 text-center w-full font-medium flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Job completed
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
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
