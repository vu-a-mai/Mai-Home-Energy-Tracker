import { Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useDemoMode } from './contexts/DemoContext'
import NavBar from './components/NavBar'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import EnergyLogs from './pages/EnergyLogs'
import BillSplit from './pages/BillSplit'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  const { user, loading } = useAuth()
  const { isDemoMode } = useDemoMode()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-foreground">
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
        <Route path="*" element={<LandingPage />} />
      </Routes>
    )
  }

  // Show Dashboard and protected routes for authenticated users OR demo mode
  return (
    <div className="bg-background min-h-screen text-foreground">
      <NavBar />
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/logs" element={<EnergyLogs />} />
          <Route path="/bill-split" element={<BillSplit />} />
          <Route path="/login" element={<Dashboard />} /> {/* Redirect logged-in users to dashboard */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
