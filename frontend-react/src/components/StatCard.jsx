export default function StatCard({ icon: Icon, label, value, sublabel, accent = 'teal', loading }) {
  const accents = {
    teal: { bg: 'bg-teal-700/15', text: 'text-teal-400', ring: 'ring-teal-600/20' },
    blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', ring: 'ring-blue-500/20' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', ring: 'ring-amber-500/20' },
    red: { bg: 'bg-red-500/15', text: 'text-red-400', ring: 'ring-red-500/20' },
    green: { bg: 'bg-green-500/15', text: 'text-green-400', ring: 'ring-green-500/20' },
  }

  const a = accents[accent]

  return (
    <div className="card card-hover p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-400 font-medium mb-1">{label}</p>
          {loading ? (
            <div className="h-8 w-20 bg-navy-800/60 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-white tracking-tight">
              {value}
            </p>
          )}
          {sublabel && (
            <p className="text-xs text-slate-500 mt-1">{sublabel}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl ${a.bg} ${a.text} flex items-center justify-center ring-1 ${a.ring} shrink-0`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}
