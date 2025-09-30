import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from '../contexts/DemoContext'

export default function NavBar() {
  const { user, logout } = useAuth()
  const { isDemoMode, disableDemoMode } = useDemoMode()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="flex items-center justify-between gap-3 p-3 bg-card border-b border-border">
      {/* Left: Navigation Links */}
      <div className="flex gap-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `no-underline px-4 py-2 rounded-md transition-all ${
              isActive 
                ? 'font-bold text-foreground bg-card border-2 border-primary shadow-[0_0_20px_rgba(34,197,94,0.6)]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink 
          to="/devices" 
          className={({ isActive }) => 
            `no-underline px-4 py-2 rounded-md transition-all ${
              isActive 
                ? 'font-bold text-foreground bg-card border-2 border-primary shadow-[0_0_20px_rgba(34,197,94,0.6)]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`
          }
        >
          Devices
        </NavLink>
        <NavLink 
          to="/logs" 
          className={({ isActive }) => 
            `no-underline px-4 py-2 rounded-md transition-all ${
              isActive 
                ? 'font-bold text-foreground bg-card border-2 border-primary shadow-[0_0_20px_rgba(34,197,94,0.6)]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`
          }
        >
          Energy Logs
        </NavLink>
        <NavLink 
          to="/bill-split" 
          className={({ isActive }) => 
            `no-underline px-4 py-2 rounded-md transition-all ${
              isActive 
                ? 'font-bold text-foreground bg-card border-2 border-primary shadow-[0_0_20px_rgba(34,197,94,0.6)]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`
          }
        >
          Bill Split
        </NavLink>
      </div>

      {/* Right: Date/Time and User Profile */}
      <div className="flex items-center gap-4">
        {/* Date and Time */}
        <div className="text-right text-sm">
          <div className="text-muted-foreground">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-lg font-bold font-mono text-foreground">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 bg-muted hover:bg-muted/80 px-3 py-2 rounded-lg transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-sm font-bold text-white">
              {(isDemoMode ? 'Vu' : user?.email?.split('@')[0] || 'User').charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">
                {isDemoMode ? 'Vu' : user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isDemoMode ? 'Demo Mode' : 'User'}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{showUserMenu ? '▲' : '▼'}</span>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-32 bg-gradient-to-br from-slate-800 to-slate-900 border border-primary rounded shadow-[0_0_15px_rgba(34,197,94,0.6)] z-50">
                <div className="p-1">
                  {isDemoMode ? (
                    <button
                      onClick={() => {
                        disableDemoMode()
                        navigate('/login')
                        setShowUserMenu(false)
                      }}
                      className="w-full text-left px-2 py-1.5 hover:bg-primary/30 rounded flex items-center gap-1.5 text-white font-medium text-xs transition-all"
                    >
                      <span className="text-sm">🚪</span>
                      <span>Exit Demo</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowUserMenu(false)
                      }}
                      className="w-full text-left px-2 py-1.5 hover:bg-primary/30 rounded flex items-center gap-1.5 text-white font-medium text-xs transition-all"
                    >
                      <span className="text-sm">🚪</span>
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
