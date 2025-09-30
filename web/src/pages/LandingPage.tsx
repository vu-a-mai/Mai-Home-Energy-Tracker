import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 energy-header-gradient rounded-b-2xl shadow-xl energy-glow mb-8">
        <div className="text-2xl font-bold text-white energy-pulse">
          ⚡ Mai Energy Tracker
        </div>
        <Link 
          to="/login"
          className="inline-flex items-center justify-center px-6 py-2 bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 transition-all duration-300 rounded-lg font-semibold"
        >
          Login
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-20 px-5 slide-up">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-foreground energy-pulse leading-tight">
            Smart Energy Management
          </h1>
          <h2 className="text-2xl md:text-3xl mb-8 font-normal text-muted-foreground">
            for the Mai Family
          </h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed text-muted-foreground px-4">
            Track household energy usage, calculate costs with TOU-D-PRIME rates, and fairly split electricity bills between family members.
          </p>
          <Link 
            to="/login"
            className="energy-action-btn inline-flex items-center justify-center px-8 py-4 text-xl font-bold shadow-2xl rounded-lg"
          >
            Get Started →
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-5 bg-muted/30 slide-up">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-16 text-foreground">
            Why Choose Mai Energy Tracker?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Feature 1 */}
            <div className="energy-card text-center p-8 hover:scale-105 transition-transform flex flex-col h-full">
              <div className="text-6xl mb-6 energy-pulse">🔌</div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                Device Management
              </h3>
              <p className="text-muted-foreground leading-relaxed flex-grow">
                Add and track all household devices with automatic kWh calculations. Mark devices as personal or shared for accurate cost allocation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="energy-card text-center p-8 hover:scale-105 transition-transform flex flex-col h-full">
              <div className="text-6xl mb-6 energy-pulse">⏰</div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                Smart Rate Calculation
              </h3>
              <p className="text-muted-foreground leading-relaxed flex-grow">
                Automatic TOU-D-PRIME rate detection with seasonal adjustments. No manual rate selection needed - the system knows the time and date.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="energy-card text-center p-8 hover:scale-105 transition-transform flex flex-col h-full">
              <div className="text-6xl mb-6 energy-pulse">💳</div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                Fair Bill Splitting
              </h3>
              <p className="text-muted-foreground leading-relaxed flex-grow">
                Automatically calculate personal device costs and split shared expenses evenly among family members for transparent billing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Information */}
      <section className="py-20 px-5 bg-card slide-up">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            TOU-D-PRIME Rate Structure
          </h2>
          <p className="text-lg md:text-xl mb-12 text-muted-foreground max-w-2xl mx-auto px-4">
            Our system automatically detects the correct rate period based on time and season
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            <div className="energy-gradient-green p-6 rounded-lg text-center rate-indicator text-white flex flex-col justify-between h-full">
              <div className="text-4xl mb-3">🟢</div>
              <h4 className="text-lg font-bold mb-2">Off-Peak</h4>
              <p className="text-2xl font-bold mb-2">$0.25/kWh</p>
              <p className="text-sm opacity-90">Nights & Early Morning</p>
            </div>
            
            <div className="energy-gradient-yellow p-6 rounded-lg text-center rate-indicator text-white flex flex-col justify-between h-full">
              <div className="text-4xl mb-3">🟡</div>
              <h4 className="text-lg font-bold mb-2">Mid-Peak</h4>
              <p className="text-2xl font-bold mb-2">$0.37-0.52/kWh</p>
              <p className="text-sm opacity-90">Afternoon Hours</p>
            </div>
            
            <div className="energy-gradient-red p-6 rounded-lg text-center rate-indicator text-white flex flex-col justify-between h-full">
              <div className="text-4xl mb-3">🔴</div>
              <h4 className="text-lg font-bold mb-2">On-Peak</h4>
              <p className="text-2xl font-bold mb-2">$0.55/kWh</p>
              <p className="text-sm opacity-90">4PM - 9PM Summer</p>
            </div>
            
            <div className="energy-gradient-blue p-6 rounded-lg text-center rate-indicator text-white flex flex-col justify-between h-full">
              <div className="text-4xl mb-3">🔵</div>
              <h4 className="text-lg font-bold mb-2">Super Off-Peak</h4>
              <p className="text-2xl font-bold mb-2">$0.24/kWh</p>
              <p className="text-sm opacity-90">8AM - 4PM Winter</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-5 energy-header-gradient text-center text-white slide-up">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 energy-pulse">
            Ready to Start Tracking?
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto px-4 leading-relaxed">
            Join the Mai family in smart energy management. Login to access your personalized dashboard.
          </p>
          <Link 
            to="/login"
            className="inline-flex items-center justify-center bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg md:text-xl font-bold shadow-2xl rounded-lg transition-all duration-300"
          >
            Login to Dashboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-5 bg-muted text-center text-muted-foreground">
        <p className="text-sm">
          © 2025 Mai Family Energy Tracker • Built with React & Supabase • TOU-D-PRIME Rate Structure
        </p>
      </footer>
    </div>
  )
}
