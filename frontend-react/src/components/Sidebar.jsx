import {
  LayoutDashboard,
  Activity,
  ChartBar as BarChart3,
  Brain,
  Bell,
  Wrench,
  CreditCard,
  Droplets,
  X,
  LogOut,
  UserCheck,
  ListChecks,
} from 'lucide-react'
import { useAuth } from '../auth.jsx'

const NAV_BY_ROLE = {
  resident: [
    { id: 'resident-status', label: 'My Drainage Point', icon: Activity },
    { id: 'resident-alerts', label: 'My Alerts', icon: Bell },
    { id: 'resident-bookings', label: 'My Requests', icon: Wrench },
  ],
  worker: [
    { id: 'worker-jobs', label: 'My Jobs', icon: Wrench },
  ],
  admin: [
    { id: 'admin-dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'admin-requests', label: 'Maintenance Requests', icon: ListChecks },
    { id: 'admin-progress', label: 'Worker Progress', icon: UserCheck },
    { id: 'monitoring', label: 'Sensor Monitoring', icon: Activity },
    { id: 'analytics', label: 'Sensor Analytics', icon: BarChart3 },
    { id: 'ai', label: 'AI Risk Analysis', icon: Brain },
    { id: 'alerts', label: 'All Alerts', icon: Bell },
  ],
}

export default function Sidebar({ activeView, onNavigate, alertCount, isOpen, onClose }) {
  const { user, logout } = useAuth()

  if (!user) return null

  const navItems = NAV_BY_ROLE[user.role] || []
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1)

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

        {/* User info */}
        <div className="px-4 py-3 border-b border-navy-800/50">
          <p className="text-sm text-slate-200 font-medium truncate">{user.full_name}</p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
          <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-700/15 text-teal-400 border border-teal-500/20">
            {roleLabel}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="px-3 mb-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Menu
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
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
                    {item.id === 'resident-alerts' && alertCount > 0 && (
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

        {/* Footer with logout */}
        <div className="px-3 py-4 border-t border-navy-800/50 space-y-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span>Sign Out</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-600 px-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            <span>System Online</span>
          </div>
        </div>
      </aside>
    </>
  )
}
