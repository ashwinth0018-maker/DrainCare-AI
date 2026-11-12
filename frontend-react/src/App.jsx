import { useEffect, useState, useCallback } from 'react'
import { Menu, Droplets } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import { ToastProvider, useToast } from './components/Toast.jsx'
import { AuthProvider, useAuth } from './auth.jsx'
import Login from './views/Login.jsx'
import Overview from './views/Overview.jsx'
import Monitoring from './views/Monitoring.jsx'
import Analytics from './views/Analytics.jsx'
import AIAnalysis from './views/AIAnalysis.jsx'
import Alerts from './views/Alerts.jsx'
import Bookings from './views/Bookings.jsx'
import Payment from './views/Payment.jsx'
import PaymentResult from './views/PaymentResult.jsx'
import ResidentStatus from './views/ResidentStatus.jsx'
import ResidentAlerts from './views/ResidentAlerts.jsx'
import ResidentBookings from './views/ResidentBookings.jsx'
import WorkerJobs from './views/WorkerJobs.jsx'
import AdminDashboard from './views/AdminDashboard.jsx'
import AdminRequests from './views/AdminRequests.jsx'
import AdminProgress from './views/AdminProgress.jsx'
import { api } from './api.js'

function AppContent() {
  const toast = useToast()
  const { user, loading, isAuthenticated } = useAuth()
  const [activeView, setActiveView] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [analyzeId, setAnalyzeId] = useState(null)
  const [alertCount, setAlertCount] = useState(0)

  const navigate = useCallback((view) => {
    setActiveView(view)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Set default view based on role
  // Reset dashboard whenever authentication or role changes
useEffect(() => {
  if (!isAuthenticated || !user) {
    setActiveView(null)
    setAlertCount(0)
    return
  }

  const defaults = {
    resident: 'resident-status',
    worker: 'worker-jobs',
    admin: 'admin-dashboard',
  }

  setActiveView(defaults[user.role] || 'overview')
}, [isAuthenticated, user?.role])

  // Check for payment result URL
  useEffect(() => {
    if (!isAuthenticated) return
    const path = window.location.pathname
    const params = new URLSearchParams(window.location.search)
    if (path === '/payment/success' || path === '/payment/cancel' || params.get('token')) {
      setActiveView('payment-result')
    }
  }, [isAuthenticated])

  // Poll alert count for sidebar badge
  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    const fetchAlerts = async () => {
      try {
        const role = user?.role
        if (role === 'resident') {
          const data = await api.residentAlerts()
          if (active) setAlertCount(data.length)
        } else if (role === 'admin') {
          const data = await api.getAlerts()
          if (active) setAlertCount(data.length)
        }
      } catch {
        // silent
      }
    }
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [isAuthenticated, user, activeView])

  const handleAnalyze = useCallback((readingId) => {
    setAnalyzeId(readingId)
    navigate('ai')
  }, [navigate])

  const handleSimulation = useCallback(
    (message, type) => {
      if (type === 'success') toast.success(message)
      else if (type === 'error') toast.error(message)
      else toast.info(message)
    },
    [toast],
  )

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-700 flex items-center justify-center animate-pulse">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-slate-500">Loading DrainCare AI...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onToast={handleSimulation} />
  }

  const renderView = () => {
    switch (activeView) {
      // Resident views
      case 'resident-status':
        return <ResidentStatus />
      case 'resident-alerts':
        return <ResidentAlerts />
      case 'resident-bookings':
        return <ResidentBookings onToast={handleSimulation} />

      // Worker views
      case 'worker-jobs':
        return <WorkerJobs onToast={handleSimulation} />

      // Admin views
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={navigate} />
      case 'admin-requests':
        return <AdminRequests onToast={handleSimulation} />
      case 'admin-progress':
        return <AdminProgress onToast={handleSimulation} />

      // Shared views (admin + existing)
      case 'overview':
        return <Overview onNavigate={navigate} onSimulation={handleSimulation} />
      case 'monitoring':
        return <Monitoring onAnalyze={handleAnalyze} onSimulation={handleSimulation} />
      case 'analytics':
        return <Analytics />
      case 'ai':
        return <AIAnalysis preselectedId={analyzeId} onSimulation={handleSimulation} />
      case 'alerts':
        return <Alerts onSimulation={handleSimulation} />
      case 'bookings':
        return <Bookings onSimulation={handleSimulation} />
      case 'payment':
        return <Payment preselectedBookingId={null} onSimulation={handleSimulation} />
      case 'payment-result':
        return <PaymentResult onNavigate={navigate} />

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar
        activeView={activeView}
        onNavigate={navigate}
        alertCount={alertCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-16 border-b border-navy-800/50 bg-navy-950 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">DrainCare AI</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}
