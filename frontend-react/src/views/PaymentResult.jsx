import { useEffect, useState } from 'react'
import { CircleCheck as CheckCircle2, Circle as XCircle, Loader as Loader2, ArrowLeft, RefreshCw } from 'lucide-react'

export default function PaymentResult({ onNavigate }) {
  const [status, setStatus] = useState('loading') // loading | success | error | info
  const [details, setDetails] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const payerId = params.get('PayerID')
    const cancelled = params.get('cancelled')

    if (cancelled) {
      setStatus('error')
      setMessage('Payment was cancelled. You can try again anytime.')
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('No payment information found in the URL.')
      return
    }

    // The backend GET /payment/success endpoint handles the PayPal capture.
    // We call it directly — the frontend never marks a payment as paid on its own.
    const controller = new AbortController()

    const checkPayment = async () => {
      try {
        const url = `/payment/success?token=${encodeURIComponent(token)}${payerId ? `&PayerID=${encodeURIComponent(payerId)}` : ''}`
        const res = await fetch(url)
        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          setMessage(data.detail || 'Payment verification failed.')
          return
        }

        setDetails(data)

        if (data.payment_status === 'Paid') {
          setStatus('success')
        } else {
          setStatus('info')
          setMessage(
            data.message ||
              'Payment is not yet completed. You may need to retry.',
          )
        }
      } catch {
        setStatus('error')
        setMessage('Unable to reach the payment server. Please try again.')
      }
    }

    checkPayment()

    return () => controller.abort()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="card p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-teal-700/15 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Confirming Payment
            </h2>
            <p className="text-sm text-slate-500">
              Verifying your payment with PayPal...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/15 flex items-center justify-center mb-4 animate-slide-up">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Payment Successful
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              {details?.message || 'Your payment has been completed.'}
            </p>
            {details && (
              <div className="bg-navy-950/40 rounded-lg p-4 text-left space-y-2 mb-4">
                <DetailRow label="Booking ID" value={`#${details.booking_id}`} />
                <DetailRow label="PayPal Order" value={details.paypal_order_id || '—'} />
                <DetailRow label="Payment Status" value={details.payment_status} />
                <DetailRow label="PayPal Status" value={details.paypal_status || '—'} />
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => onNavigate('payment')}
                className="btn-primary"
              >
                <RefreshCw className="w-4 h-4" />
                View Payments
              </button>
              <button onClick={() => onNavigate('overview')} className="btn-secondary">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          </>
        )}

        {status === 'info' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/15 flex items-center justify-center mb-4">
              <RefreshCw className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Payment Incomplete
            </h2>
            <p className="text-sm text-slate-400 mb-4">{message}</p>
            {details && (
              <div className="bg-navy-950/40 rounded-lg p-4 text-left space-y-2 mb-4">
                <DetailRow label="Booking ID" value={`#${details.booking_id}`} />
                <DetailRow label="Payment Status" value={details.payment_status} />
                <DetailRow label="PayPal Status" value={details.paypal_status || '—'} />
              </div>
            )}
            <button
              onClick={() => onNavigate('payment')}
              className="btn-primary"
            >
              Back to Payments
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/15 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Payment Not Completed
            </h2>
            <p className="text-sm text-slate-400 mb-4">{message}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => onNavigate('payment')}
                className="btn-primary"
              >
                Try Again
              </button>
              <button onClick={() => onNavigate('overview')} className="btn-secondary">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-medium truncate ml-2 max-w-[200px]">
        {value}
      </span>
    </div>
  )
}
