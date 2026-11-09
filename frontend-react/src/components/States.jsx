import { Loader as Loader2 } from 'lucide-react'

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
        <span className="text-red-400 text-xl">!</span>
      </div>
      <p className="text-sm text-slate-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm">
          Try Again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-navy-800/60 flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-600" />
        </div>
      )}
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
