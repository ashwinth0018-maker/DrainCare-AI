import { useEffect, useState, useCallback } from 'react'
import { CreditCard, RefreshCw, ExternalLink, Loader as Loader2, CircleCheck as CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

export default function Payment({ preselectedBookingId, onSimulation }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [payingId, setPayingId] = useState(null)
  const [highlightedId, setHighlightedId] = useState(preselectedBookingId || null)

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

  useEffect(() => {
    if (preselectedBookingId) {
      setHighlightedId(preselectedBookingId)
    }
  }, [preselectedBookingId])

  const handlePay = async (bookingId) => {
    setPayingId(bookingId)
    try {
      const result = await api.createPayment(bookingId)
      onSimulation?.('Redirecting to PayPal for approval...', 'info')
      // Redirect to PayPal approval URL — the backend controls capture on return
      window.location.href = result.approval_url
    } catch (err) {
      onSimulation?.(err.message, 'error')
      setPayingId(null)
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <LoadingState message="Loading payment data..." />
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

  const unpaid = bookings.filter((b) => b.payment_status !== 'Paid')
  const paid = bookings.filter((b) => b.payment_status === 'Paid')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Payment Management</h2>
          <p className="text-sm text-slate-500 mt-1">
            {unpaid.length} pending · {paid.length} completed
          </p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 border-l-2 border-l-teal-600/50 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-700/15 flex items-center justify-center shrink-0">
          <CreditCard className="w-4 h-4 text-teal-400" />
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Payments are processed through PayPal Sandbox. Clicking <strong className="text-slate-300">Pay Now</strong> redirects
          you to PayPal for approval. Payment status is only updated after the backend confirms
          successful capture — never from the frontend alone.
        </p>
      </div>

      {/* Unpaid bookings */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Awaiting Payment
        </h3>
        {unpaid.length === 0 ? (
          <div className="card p-6">
            <EmptyState
              icon={CheckCircle2}
              message="All bookings have been paid. No pending payments."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unpaid.map((b) => (
              <PaymentCard
                key={b.booking_id}
                booking={b}
                onPay={handlePay}
                paying={payingId === b.booking_id}
                highlighted={highlightedId === b.booking_id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Paid bookings */}
      {paid.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Payment History
          </h3>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-navy-800/50">
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paid.map((b) => (
                    <tr key={b.booking_id} className="table-row">
                      <td className="px-4 py-3 font-medium text-slate-400">#{b.booking_id}</td>
                      <td className="px-4 py-3 text-slate-200">{b.customer_name}</td>
                      <td className="px-4 py-3 text-slate-400">{b.service_type}</td>
                      <td className="px-4 py-3 text-slate-300 font-medium">₹{b.amount}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatDateTime(b.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentCard({ booking, onPay, paying, highlighted }) {
  return (
    <div
      className={`card p-5 transition-all duration-300 ${
        highlighted
          ? 'ring-2 ring-teal-600/50 border-teal-600/40'
          : 'hover:border-teal-600/30'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs text-slate-600">Booking #{booking.booking_id}</span>
          <h4 className="text-sm font-semibold text-white mt-0.5">
            {booking.customer_name}
          </h4>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          {booking.payment_status}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-slate-500 mb-4">
        <p><span className="text-slate-600">Service:</span> {booking.service_type}</p>
        <p><span className="text-slate-600">Location:</span> {booking.location}</p>
        <p><span className="text-slate-600">Date:</span> {formatDateTime(booking.created_at)}</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-navy-800/50">
        <div>
          <p className="text-xs text-slate-500">Amount Due</p>
          <p className="text-lg font-bold text-white">
            ₹{booking.amount}
            <span className="text-xs text-slate-500 font-normal ml-1.5">(~12 USD)</span>
          </p>
        </div>
        <button
          onClick={() => onPay(booking.booking_id)}
          disabled={paying}
          className="btn-primary"
        >
          {paying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay Now
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
