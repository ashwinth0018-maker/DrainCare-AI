import { useEffect, useState, useCallback } from 'react'
import { Wrench, RefreshCw, Send } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

const SERVICE_TYPES = [
  'Drainage Cleaning',
  'Drainage Inspection',
  'Emergency Maintenance',
]

export default function Bookings({ onSimulation, onNavigatePayment }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    location: '',
    service_type: '',
  })

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await api.getBookings()
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
      await api.createBooking({
        customer_name: form.customer_name,
        phone: form.phone,
        email: form.email,
        location: form.location,
        service_type: form.service_type,
      })
      onSimulation?.('Maintenance booking created successfully', 'success')
      setForm({ customer_name: '', phone: '', email: '', location: '', service_type: '' })
      setShowForm(false)
      await load()
    } catch (err) {
      onSimulation?.(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <LoadingState message="Loading bookings..." />
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
          <h2 className="text-xl font-semibold text-white">Maintenance Bookings</h2>
          <p className="text-sm text-slate-500 mt-1">
            {bookings.length} total booking(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Wrench className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Create Maintenance Booking
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 font-medium">Customer Name</label>
              <input
                type="text"
                required
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="input-field mt-1"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Phone Number</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field mt-1"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field mt-1"
                placeholder="john@example.com"
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
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Create Booking
                  </>
                )}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bookings table */}
      <div className="card overflow-hidden">
        {bookings.length === 0 ? (
          <EmptyState
            icon={Wrench}
            message="No maintenance bookings yet. Click 'New Booking' to create one."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-navy-800/50">
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Booking Status</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.booking_id} className="table-row">
                    <td className="px-4 py-3 font-medium text-slate-400">#{b.booking_id}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200 font-medium">{b.customer_name}</p>
                      <p className="text-xs text-slate-500">{b.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{b.location}</td>
                    <td className="px-4 py-3 text-slate-400">{b.service_type}</td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.booking_status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={b.payment_status} />
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-medium">
                      ₹{b.amount}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDateTime(b.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.payment_status !== 'Paid' && (
                        <button
                          onClick={() => onNavigatePayment?.(b.booking_id)}
                          className="text-teal-400 hover:text-teal-300 text-xs font-medium transition-colors"
                        >
                          Pay →
                        </button>
                      )}
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

function BookingStatusBadge({ status }) {
  const map = {
    Pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    Confirmed: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    Completed: 'bg-green-500/15 text-green-400 border border-green-500/20',
    Cancelled: 'bg-red-500/15 text-red-400 border border-red-500/20',
  }
  const cls = map[status] || map.Pending
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}

function PaymentStatusBadge({ status }) {
  const map = {
    Paid: 'bg-green-500/15 text-green-400 border border-green-500/20',
    Pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    Failed: 'bg-red-500/15 text-red-400 border border-red-500/20',
  }
  const cls = map[status] || map.Pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}
