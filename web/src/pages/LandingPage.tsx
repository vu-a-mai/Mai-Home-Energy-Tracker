import { Link, useNavigate } from 'react-router'
import {
  BoltIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  CodeBracketSquareIcon,
  ServerStackIcon,
  PaintBrushIcon,
  RocketLaunchIcon,
  ChartPieIcon,
  Squares2X2Icon,
  CircleStackIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

import { useDemoMode } from '../contexts/DemoContext'

export default function LandingPage() {
  const navigate = useNavigate()
  const { enableDemoMode } = useDemoMode()
  
  const handleTryDemo = async () => {
    await enableDemoMode()
    navigate('/dashboard')
  }
  
  return (
    <div className="min-h-dvh bg-background text-foreground font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-3 sm:p-4 md:p-6 energy-header-gradient rounded-b-2xl shadow-xl energy-glow mb-6 md:mb-8">
        <div className="text-lg sm:text-xl md:text-2xl font-bold text-white energy-pulse flex items-center gap-2">
          <BoltIcon className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400" />
          Mai Energy Tracker
        </div>
        <Link 
          to="/login"
          className="inline-flex items-center justify-center px-4 sm:px-5 md:px-6 py-2 text-sm md:text-base bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 transition-all duration-300 rounded-lg font-semibold"
        >
          Login
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-8 md:py-12 px-3 md:px-5 slide-up">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 md:mb-3 text-foreground energy-pulse leading-tight text-center">
            Smart Energy Management
          </h1>
          <h2 className="text-lg sm:text-xl md:text-2xl mb-4 md:mb-6 font-normal text-muted-foreground text-center">for the Family</h2>
          <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-4 md:mb-6 leading-relaxed text-muted-foreground px-4 text-center">
            Track usage, automate logging, apply TOU rates, and split the bill fairly—then try it live before you log in.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link 
              to="/login"
              className="energy-action-btn inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-bold shadow-2xl rounded-lg"
            >
              Login
            </Link>
            <button
              onClick={handleTryDemo}
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-bold rounded-lg border border-primary/40 bg-card text-foreground hover:bg-card/80 hover:shadow-lg transition-all duration-200"
            >
              Try Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 md:py-10 px-3 md:px-5 bg-muted/30 slide-up">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-foreground">
            What you can do
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
            <div className="energy-card text-center p-4 md:p-6 hover:scale-105 transition-transform flex flex-col h-full">
              <CpuChipIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-cyan-400 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">
                Devices & logs
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">
                Track household devices, log timed usage or quick kWh totals, and reuse templates for common routines.
              </p>
            </div>

            <div className="energy-card text-center p-4 md:p-6 hover:scale-105 transition-transform flex flex-col h-full">
              <ArrowPathIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-green-400 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">
                Schedules & automation
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">
                Set recurring schedules once and generate matching logs automatically—or in bulk for a date range.
              </p>
            </div>

            <div className="energy-card text-center p-4 md:p-6 hover:scale-105 transition-transform flex flex-col h-full">
              <CurrencyDollarIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-green-400 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">
                TOU costs & bill split
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">
                Apply TOU-D-PRIME seasons automatically, then allocate personal and shared costs across the household.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Information */}
      <section className="py-8 md:py-10 px-3 md:px-5 bg-card slide-up">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-foreground">
              TOU-D-PRIME Rate Structure
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl px-4">
              Our system automatically detects the correct rate period based on time and season
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch justify-items-center max-w-5xl mx-auto">
            <div className="energy-gradient-green p-5 rounded-lg text-center rate-indicator text-white flex flex-col justify-center items-center h-full w-full">
              <div className="w-10 h-10 rounded-full bg-green-500 mb-2"></div>
              <h4 className="text-base font-bold mb-1">Off-Peak</h4>
              <p className="text-xl font-bold mb-1">$0.25/kWh</p>
              <p className="text-xs opacity-90">Nights & Early Morning</p>
            </div>
            
            <div className="energy-gradient-yellow p-5 rounded-lg text-center rate-indicator text-white flex flex-col justify-center items-center h-full w-full">
              <div className="w-10 h-10 rounded-full bg-yellow-500 mb-2"></div>
              <h4 className="text-base font-bold mb-1">Mid-Peak</h4>
              <p className="text-xl font-bold mb-1">$0.37-0.52/kWh</p>
              <p className="text-xs opacity-90">Afternoon Hours</p>
            </div>
            
            <div className="energy-gradient-red p-5 rounded-lg text-center rate-indicator text-white flex flex-col justify-center items-center h-full w-full">
              <div className="w-10 h-10 rounded-full bg-red-500 mb-2"></div>
              <h4 className="text-base font-bold mb-1">On-Peak</h4>
              <p className="text-xl font-bold mb-1">$0.55/kWh</p>
              <p className="text-xs opacity-90">4PM - 9PM Summer</p>
            </div>
            
            <div className="energy-gradient-blue p-5 rounded-lg text-center rate-indicator text-white flex flex-col justify-center items-center h-full w-full">
              <div className="w-10 h-10 rounded-full bg-blue-500 mb-2"></div>
              <h4 className="text-base font-bold mb-1">Super Off-Peak</h4>
              <p className="text-xl font-bold mb-1">$0.24/kWh</p>
              <p className="text-xs opacity-90">8AM - 4PM Winter</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 md:py-12 px-3 md:px-5 energy-header-gradient text-center text-white slide-up">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4 energy-pulse">
            Ready to Start Tracking?
          </h2>
          <p className="text-sm sm:text-base md:text-lg mb-4 md:mb-6 opacity-90 max-w-3xl px-4 leading-relaxed">
            Explore the live demo, or log in to manage your household energy.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleTryDemo}
              className="inline-flex items-center justify-center bg-white text-primary hover:bg-white/90 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base md:text-lg font-bold shadow-2xl rounded-lg transition-all duration-300"
            >
              Try Live Demo
            </button>
            <Link 
              to="/login"
              className="inline-flex items-center justify-center border-2 border-white/40 text-white hover:bg-white/10 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base md:text-lg font-bold rounded-lg transition-all duration-300"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-5 bg-muted">
        <div className="max-w-6xl mx-auto">
          {/* Tech Stack Section */}
          <div className="mb-8 text-center">
            <h3 className="text-lg font-bold text-foreground mb-4">Built With Modern Technology</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <BoltIcon className="w-5 h-5 text-cyan-400" />
                  <p className="font-semibold text-foreground">React</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Frontend Framework</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CodeBracketSquareIcon className="w-5 h-5 text-blue-400" />
                  <p className="font-semibold text-foreground">TypeScript</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Type Safety</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <ServerStackIcon className="w-5 h-5 text-emerald-400" />
                  <p className="font-semibold text-foreground">Supabase</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Database & Auth</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <PaintBrushIcon className="w-5 h-5 text-sky-400" />
                  <p className="font-semibold text-foreground">Tailwind CSS</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Styling</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <RocketLaunchIcon className="w-5 h-5 text-purple-400" />
                  <p className="font-semibold text-foreground">Vite</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Build Tool</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <ChartPieIcon className="w-5 h-5 text-pink-400" />
                  <p className="font-semibold text-foreground">Recharts</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Data Visualization</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Squares2X2Icon className="w-5 h-5 text-indigo-400" />
                  <p className="font-semibold text-foreground">Heroicons</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Icon System</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CircleStackIcon className="w-5 h-5 text-blue-500" />
                  <p className="font-semibold text-foreground">PostgreSQL</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Database</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-8"></div>

          {/* Credits & Copyright */}
          <div className="text-center space-y-3">
            <p className="text-sm text-foreground font-medium">
              💡 App Idea and Design by <span className="font-bold text-primary">Vu Mai</span>
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 Mai Family Energy Tracker • TOU-D-PRIME Rate Structure
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
