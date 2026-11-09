import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CircleCheck as CheckCircle, Circle as AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }, [])

  const show = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, message, type }])
      timersRef.current[id] = setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const toast = useCallback(
    {
      success: (msg) => show(msg, 'success'),
      error: (msg) => show(msg, 'error', 6000),
      info: (msg) => show(msg, 'info'),
    },
    [show],
  )

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-teal-400" />,
  }

  const borders = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    info: 'border-teal-500/30',
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`card ${borders[t.type]} px-4 py-3 flex items-start gap-3 animate-slide-up`}
          >
            {icons[t.type]}
            <p className="text-sm text-slate-200 flex-1 leading-relaxed">
              {t.message}
            </p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
