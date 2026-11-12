import { useEffect, useState, useCallback } from 'react'
import { Wrench, RefreshCw, Send, CreditCard, ArrowRight, Loader as Loader2 } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

const SERVICE_TYPES = [
  'Drainage Cleaning',
  'Drainage Inspection',
  'Emergency Maintenance',
]

export default function ResidentBookings({ onToast, onNavigatePayment }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [payingId, setPayingId] = useState(null)
  const [form, setForm] = useState({ phone: '', location: '', service_type: '' })

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await api.residentBookings()
      setBookings(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.residentCreateBooking({
        phone: form.phone,
        location: form.location,
        service_type: form.service_type,
      })
      onToast?.('Maintenance request submitted successfully', 'success')
      setForm({ phone: '', location: '', service_type: '' })
      setShowForm(false)
      await load()
    } catch (err) {
      onToast?.(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePay = async (bookingId) => {
    setPayingId(bookingId)
    try {
      const result = await api.createPayment(bookingId)
      onToast?.('Redirecting to PayPal for approval...', 'info')
      window.location.href = result.approval_url
    } catch (err) {
      onToast?.(err.message, 'error')
      setPayingId(null)
    }
  }

  if (loading) return <div className="card p-6"><LoadingState message="Loading your requests..." /></div>
  if (error) return <div className="card p-6"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">My Maintenance Requests</h2>
          <p className="text-sm text-slate-500 mt-1">{bookings.length} request(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Wrench className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Submit Maintenance Request</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 font-medium">Phone Number</label>
              <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                setForm({ ...form, phone: digits });
              }}
              pattern="[0-9]{10}"
              minLength={10}
              maxLength={10}
              className="input-field mt-1"
              placeholder="98765 43210"
             />             
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Drainage Location</label>
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
              <label className="text-xs text-slate-500 font-medium">Service Type</label>
              <select
                required
                value={form.service_type}
                onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                className="input-field mt-1"
              >
                <option value="">Select Service</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Request</>
                )}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="card p-6">
          <EmptyState icon={Wrench} message="No maintenance requests yet. Click 'New Request' to submit one." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((b) => (
            <div key={b.booking_id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-slate-600">Request #{b.booking_id}</span>
                  <h4 className="text-sm font-semibold text-white mt-0.5">{b.service_type}</h4>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  <StatusBadgeBooking status={b.booking_status} />
                  <StatusBadgePayment status={b.payment_status} />
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                <p><span className="text-slate-600">Location:</span> {b.location}</p>
                <p><span className="text-slate-600">Date:</span> {formatDateTime(b.created_at)}</p>
                <p><span className="text-slate-600">Amount:</span> ₹{b.amount} (~12 USD)</p>
              </div>
              {b.payment_status !== 'Paid' && b.booking_status === 'Solved' && (
                <button
                  onClick={() => handlePay(b.booking_id)}
                  disabled={payingId === b.booking_id}
                  className="btn-primary w-full justify-center"
                >
                  {payingId === b.booking_id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <><CreditCard className="w-4 h-4" /> Pay Now <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              )}
              {b.payment_status !== 'Paid' && b.booking_status !== 'Solved' && (
                <p className="text-xs text-slate-600 text-center pt-2 border-t border-navy-800/50">
                  Payment available after the job is marked Solved
                </p>
              )}
              {b.payment_status === 'Paid' && (
                <p className="text-xs text-green-400 text-center pt-2 border-t border-navy-800/50 font-medium">
                  Payment completed
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadgeBooking({ status }) {
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

function StatusBadgePayment({ status }) {
  const map = {
    Paid: 'bg-green-500/15 text-green-400 border border-green-500/20',
    Pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    Failed: 'bg-red-500/15 text-red-400 border border-red-500/20',
  }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || map.Pending}`}>
      {status}
    </span>
  )
}
