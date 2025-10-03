import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from '../contexts/DemoContext'
import { Button } from './ui/Button'

export default function NavBar() {
  const { user, logout } = useAuth()
  const { isDemoMode, disableDemoMode } = useDemoMode()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    try {
      if (isDemoMode) {
        disableDemoMode()
        navigate('/login')
      } else {
        await logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Get user display name (capitalize first letter of each word)
  const getUserDisplayName = () => {
    if (isDemoMode) return 'Vu Mai'
    
    if (user?.email) {
      const namePart = user.email.split('@')[0]
      // Capitalize first letter
      return namePart.charAt(0).toUpperCase() + namePart.slice(1)
    }
    
    return 'User'
  }

  const navLinkClass = (isActive: boolean) =>
    `no-underline px-3 md:px-4 py-2 rounded-lg transition-all text-sm md:text-base font-medium ${
      isActive 
        ? 'text-white bg-gradient-to-r from-primary to-emerald-500 shadow-lg shadow-primary/50' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
    }`

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-primary/30 sticky top-0 z-50 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 md:px-4 md:py-3 max-w-7xl mx-auto">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-2xl md:text-3xl energy-pulse">⚡</div>
          <div className="flex flex-col">
            <span className="font-bold text-base md:text-lg text-white leading-tight">
              Mai Energy Tracker
            </span>
            <span className="text-[10px] md:text-xs text-primary/80 leading-tight hidden sm:block">
              Smart Home Energy Management
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-2">
          <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/devices" className={({ isActive }) => navLinkClass(isActive)}>
            🔌 Devices
          </NavLink>
          <NavLink to="/logs" className={({ isActive }) => navLinkClass(isActive)}>
            📋 Logs
          </NavLink>
          <NavLink to="/bill-split" className={({ isActive }) => navLinkClass(isActive)}>
            💳 Bill Split
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => navLinkClass(isActive)}>
            ⚙️ Settings
          </NavLink>
        </div>

        {/* Right: User Info, Time, and Logout */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Date and Time - Desktop Only */}
          <div className="hidden xl:flex flex-col items-end text-xs">
            <div className="text-muted-foreground text-[10px]">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-sm font-bold font-mono text-primary">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* User Display */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/20 to-emerald-500/20 border border-primary/30">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-emerald-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-tight">
                {getUserDisplayName()}
              </span>
              <span className="text-[10px] text-primary leading-tight">
                {isDemoMode ? 'Demo Mode' : 'Family Member'}
              </span>
            </div>
          </div>

          {/* Logout Button - Desktop */}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-1.5 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all"
          >
            <span className="text-base">🚪</span>
            <span className="text-sm font-medium">{isDemoMode ? 'Exit' : 'Logout'}</span>
          </Button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 transition-all"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="lg:hidden border-t-2 border-primary/30 bg-gradient-to-b from-slate-800 to-slate-900">
          <div className="flex flex-col p-3 space-y-2 max-w-7xl mx-auto">
            {/* User Info Mobile */}
            <div className="md:hidden flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-gradient-to-r from-primary/20 to-emerald-500/20 border border-primary/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-emerald-500 flex items-center justify-center text-base font-bold text-white shadow-lg">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground leading-tight">
                  {getUserDisplayName()}
                </span>
                <span className="text-xs text-primary leading-tight">
                  {isDemoMode ? 'Demo Mode' : 'Family Member'}
                </span>
              </div>
            </div>

            <NavLink
              to="/"
              onClick={() => setShowMobileMenu(false)}
              className={({ isActive }) => navLinkClass(isActive) + ' w-full justify-start'}
            >
              📊 Dashboard
            </NavLink>
            <NavLink
              to="/devices"
              onClick={() => setShowMobileMenu(false)}
              className={({ isActive }) => navLinkClass(isActive) + ' w-full justify-start'}
            >
              🔌 Devices
            </NavLink>
            <NavLink
              to="/logs"
              onClick={() => setShowMobileMenu(false)}
              className={({ isActive }) => navLinkClass(isActive) + ' w-full justify-start'}
            >
              📋 Energy Logs
            </NavLink>
            <NavLink
              to="/bill-split"
              onClick={() => setShowMobileMenu(false)}
              className={({ isActive }) => navLinkClass(isActive) + ' w-full justify-start'}
            >
              💳 Bill Split
            </NavLink>
            <NavLink
              to="/settings"
              onClick={() => setShowMobileMenu(false)}
              className={({ isActive }) => navLinkClass(isActive) + ' w-full justify-start'}
            >
              ⚙️ Settings
            </NavLink>
            
            {/* Logout Button Mobile */}
            <button
              onClick={() => {
                handleLogout()
                setShowMobileMenu(false)
              }}
              className="w-full mt-2 px-3 py-2.5 rounded-lg bg-red-500/20 border-2 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:border-red-500 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <span className="text-lg">🚪</span>
              <span>{isDemoMode ? 'Exit Demo Mode' : 'Logout'}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
