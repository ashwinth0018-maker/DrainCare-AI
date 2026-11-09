import { LayoutDashboard, Activity, ChartBar as BarChart3, Brain, Bell, Wrench, CreditCard, Droplets, X } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'monitoring', label: 'Sensor Monitoring', icon: Activity },
  { id: 'analytics', label: 'Sensor Analytics', icon: BarChart3 },
  { id: 'ai', label: 'AI Risk Analysis', icon: Brain },
  { id: 'alerts', label: 'Active Alerts', icon: Bell },
  { id: 'bookings', label: 'Maintenance Bookings', icon: Wrench },
  { id: 'payment', label: 'Payment Management', icon: CreditCard },
]

export default function Sidebar({ activeView, onNavigate, alertCount, isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-navy-950 border-r border-navy-800/50
          flex flex-col transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-navy-800/50">
          <div className="w-10 h-10 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-semibold text-base leading-tight">
              DrainCare AI
            </h1>
            <p className="text-slate-500 text-xs">Smart Drainage Monitoring</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden ml-auto text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="px-3 mb-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Menu
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = activeView === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${
                        active
                          ? 'bg-teal-700/20 text-teal-300 border-l-2 border-teal-500'
                          : 'text-slate-400 hover:bg-navy-800/50 hover:text-slate-200'
                      }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.id === 'alerts' && alertCount > 0 && (
                      <span className="bg-red-500/90 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {alertCount}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-navy-800/50">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            <span>System Online</span>
          </div>
        </div>
      </aside>
    </>
  )
}
