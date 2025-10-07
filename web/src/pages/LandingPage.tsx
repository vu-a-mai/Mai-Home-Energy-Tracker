import { Link, useNavigate } from 'react-router-dom'
import {
  BoltIcon,
  CpuChipIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CodeBracketSquareIcon,
  ServerStackIcon,
  PaintBrushIcon,
  RocketLaunchIcon,
  ChartPieIcon,
  Squares2X2Icon,
  CircleStackIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  SparklesIcon,
  FolderPlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

import { useDemoMode } from '../contexts/DemoContext'

export default function LandingPage() {
  const navigate = useNavigate()
  const { enableDemoMode } = useDemoMode()
  
  const handleTryDemo = () => {
    enableDemoMode()
    navigate('/dashboard')
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
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
            Track household energy usage, automate logging with templates & schedules, calculate costs with TOU-D-PRIME rates, and fairly split electricity bills. New: multi-device logging, quick kWh entry, reusable templates, and year-based analytics.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-4 md:mb-6" aria-label="Key features">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full text-xs md:text-sm font-medium">
              <FolderPlusIcon className="w-4 h-4" />
              Multi-Device
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-full text-xs md:text-sm font-medium">
              <SparklesIcon className="w-4 h-4" />
              Quick kWh Entry
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full text-xs md:text-sm font-medium">
              <DocumentDuplicateIcon className="w-4 h-4" />
              Templates
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-xs md:text-sm font-medium">
              <ArrowPathIcon className="w-4 h-4" />
              Auto-Recurring
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-full text-xs md:text-sm font-medium">
              <ChartPieIcon className="w-4 h-4" />
              Year Analytics
            </span>
          </div>
          <div className="mt-2 md:mt-4"></div>
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
            Why Choose Mai Energy Tracker?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
            {/* Feature 1 */}
            <div className="energy-card text-center p-4 md:p-6 hover:scale-105 transition-transform flex flex-col h-full">
              <CpuChipIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-cyan-400 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">
                Device Management
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">
                Add and track all household devices with automatic kWh calculations. Mark devices as personal or shared for accurate cost allocation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="energy-card text-center p-4 md:p-6 hover:scale-105 transition-transform flex flex-col h-full">
              <ClockIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-blue-400 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">
                Smart Rate Calculation
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">
                Automatic TOU-D-PRIME rate detection with seasonal adjustments. No manual rate selection needed - the system knows the time and date.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="energy-card text-center p-4 md:p-6 hover:scale-105 transition-transform flex flex-col h-full">
              <CurrencyDollarIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-green-400 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">
                Fair Bill Splitting
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">
                Automatically calculate personal device costs and split shared expenses evenly among family members for transparent billing.
              </p>
            </div>

            {/* Feature 4 - NEW */}
            <div className="energy-card text-center p-4 md:p-6 hover:scale-105 transition-transform flex flex-col h-full bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
              <SparklesIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-purple-400 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">
                Quick kWh Entry
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">
                Perfect for Tesla charging! Enter total kWh without exact times. Bulk monthly or daily entry modes with custom rate support.
              </p>
            </div>

            {/* Feature 5 - NEW */}
            <div className="energy-card text-center p-4 md:p-6 hover:scale-105 transition-transform flex flex-col h-full bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
              <DocumentDuplicateIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-blue-400 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">
                Reusable Templates
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">
                Save common usage patterns and reuse with one click. Create from scratch or save any existing log as a template.
              </p>
            </div>

            {/* Feature 6 - NEW */}
            <div className="energy-card text-center p-4 md:p-6 hover:scale-105 transition-transform flex flex-col h-full bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
              <ArrowPathIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-green-400 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">
                Auto-Recurring Schedules
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">
                Set it once, forget it forever! Automatically generate logs for daily/weekly routines. Pause during vacation, resume anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* New Features Highlight */}
      <section className="py-8 md:py-10 px-3 md:px-5 bg-gradient-to-br from-primary/5 to-primary/10 slide-up">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full mb-4">
              <SparklesIcon className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-primary">NEW FEATURES</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">Logging Made Effortless</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl px-4">
              Save 80% of your time with automation features. Enhanced dashboard with year-based filtering, real-time insights, and fully responsive mobile design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 bg-gradient-to-br from-purple-500/5 to-purple-600/5 border-purple-500/20">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <FolderPlusIcon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Multi-Device Selection</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select multiple devices at once! Save 5x time when logging simultaneous usage.
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Select 3+ devices instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Save as device groups</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Quick-select saved groups</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <SparklesIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Quick kWh Entry</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Don't know exact times? No problem! Enter total kWh from Tesla app or utility bill.
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Bulk monthly entry (e.g., 435 kWh)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Daily entry with estimated times</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Custom rate override support</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <DocumentDuplicateIcon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Templates</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save patterns and bulk-generate logs across date ranges with smart preview!
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Single date or bulk date range</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Select specific days (Mon-Fri)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Preview & replace existing logs</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <ArrowPathIcon className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Auto-Recurring</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bulk-generate logs for entire date ranges with smart conflict detection!
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Bulk generate all matching dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Preview conflicts before replacing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Safe skip or replace mode</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                <TrashIcon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Bulk Delete</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Safely delete multiple logs with recovery options and complete transparency!
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Soft delete with 1-90 day recovery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Device breakdown & preview</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Multi-device & date filtering</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 bg-gradient-to-br from-orange-500/5 to-orange-600/5 border-orange-500/20">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <ChartPieIcon className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Year-Based Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Compare energy usage year-over-year with smart filtering and insights!
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Current Year & Last Year filters</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Year-to-Date personal analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Annual budgeting & planning</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 bg-gradient-to-br from-pink-500/5 to-pink-600/5 border-pink-500/20">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <BoltIcon className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Fully Responsive</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Perfect experience on mobile, tablet, and desktop with adaptive layouts!
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Mobile-first design approach</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Touch-friendly interfaces</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Optimized for all screen sizes</span>
                </li>
              </ul>
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
            Join the Mai family in smart energy management. Access templates, auto-recurring schedules, quick kWh entry, year-based analytics, responsive mobile design, and more!
          </p>
          <Link 
            to="/login"
            className="inline-flex items-center justify-center bg-white text-primary hover:bg-white/90 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base md:text-lg font-bold shadow-2xl rounded-lg transition-all duration-300"
          >
            Login to Dashboard →
          </Link>
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
