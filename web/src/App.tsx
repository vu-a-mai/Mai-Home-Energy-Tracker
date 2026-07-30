import { Routes, Route } from 'react-router'
import { useAuth } from './hooks/useAuth'
import { useDemoMode } from './contexts/DemoContext'
import { Toaster } from 'sonner'
import NavBar from './components/NavBar'
import { AutoScheduleRunner } from './components/AutoScheduleRunner'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import EnergyLogs from './pages/EnergyLogs'
import DeletedLogs from './pages/DeletedLogs'
import BillSplit from './pages/BillSplit'
import Settings from './pages/Settings'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  const { user, loading, syncError } = useAuth()
  const { isDemoMode } = useDemoMode()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-dvh bg-background text-foreground">
        <h2>Loading...</h2>
      </div>
    )
  }

  // Show Landing Page for non-authenticated users (unless in demo mode)
  if (!user && !isDemoMode) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Login />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    )
  }

  // Show Dashboard and protected routes for authenticated users OR demo mode
  return (
    <div className="bg-background min-h-dvh text-foreground">
      <Toaster position="top-center" richColors closeButton className="md:!top-4 md:!right-4" />
      <NavBar />
      <AutoScheduleRunner />
      {isDemoMode && (
        <div className="bg-amber-500/15 border-b border-amber-500/40 text-amber-100 text-xs sm:text-sm px-3 py-2 text-center">
          Demo mode — changes stay in this browser only and are not saved to your live household.
        </div>
      )}
      {syncError && (
        <div className="mx-auto max-w-7xl px-3 pt-3">
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Account sync issue: {syncError}
          </div>
        </div>
      )}
      <main className="mx-auto max-w-7xl p-3 sm:p-4 md:p-5">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/logs" element={<EnergyLogs />} />
          <Route path="/logs/deleted" element={<DeletedLogs />} />
          <Route path="/bill-split" element={<BillSplit />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Dashboard />} /> {/* Redirect logged-in users to dashboard */}
          <Route path="/join" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
