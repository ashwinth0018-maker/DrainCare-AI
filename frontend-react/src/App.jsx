import { useEffect, useState, useCallback } from 'react'
import { Menu, Droplets } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import { ToastProvider, useToast } from './components/Toast.jsx'
import Overview from './views/Overview.jsx'
import Monitoring from './views/Monitoring.jsx'
import Analytics from './views/Analytics.jsx'
import AIAnalysis from './views/AIAnalysis.jsx'
import Alerts from './views/Alerts.jsx'
import Bookings from './views/Bookings.jsx'
import Payment from './views/Payment.jsx'
import PaymentResult from './views/PaymentResult.jsx'
import { api } from './api.js'

function AppContent() {
  const toast = useToast()
  const [activeView, setActiveView] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [analyzeId, setAnalyzeId] = useState(null)
  const [payBookingId, setPayBookingId] = useState(null)
  const [alertCount, setAlertCount] = useState(0)

  const navigate = useCallback((view) => {
    setActiveView(view)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Check for payment result URL
  useEffect(() => {
    const path = window.location.pathname
    const params = new URLSearchParams(window.location.search)
    if (path === '/payment/success' || path === '/payment/cancel' || params.get('token')) {
      setActiveView('payment-result')
    }
  }, [])

  // Poll alert count for sidebar badge
  useEffect(() => {
    let active = true
    const fetchAlerts = async () => {
      try {
        const data = await api.getAlerts()
        if (active) setAlertCount(data.length)
      } catch {
        // silent — badge is non-critical
      }
    }
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [activeView])

  const handleAnalyze = useCallback((readingId) => {
    setAnalyzeId(readingId)
    navigate('ai')
  }, [navigate])

  const handleNavigatePayment = useCallback((bookingId) => {
    setPayBookingId(bookingId)
    navigate('payment')
  }, [navigate])

  const handleSimulation = useCallback(
    (message, type) => {
      if (type === 'success') toast.success(message)
      else if (type === 'error') toast.error(message)
      else toast.info(message)
    },
    [toast],
  )

  const renderView = () => {
    switch (activeView) {
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
        return <Bookings onSimulation={handleSimulation} onNavigatePayment={handleNavigatePayment} />
      case 'payment':
        return <Payment preselectedBookingId={payBookingId} onSimulation={handleSimulation} />
      case 'payment-result':
        return <PaymentResult onNavigate={navigate} />
      default:
        return <Overview onNavigate={navigate} onSimulation={handleSimulation} />
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
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
