import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header Section */}
      <header style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          margin: '0 0 16px 0',
          fontWeight: '700'
        }}>
          ⚡ Mai Home Energy Tracker
        </h1>
        <p style={{
          fontSize: '1.2rem',
          margin: '0',
          opacity: '0.9'
        }}>
          Smart Energy Management for the Mai Family
        </p>
        <div style={{
          marginTop: '20px',
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '8px',
          display: 'inline-block'
        }}>
          Welcome back, <strong>{user?.email?.split('@')[0] || 'User'}</strong>!
        </div>
      </header>

      {/* Quick Stats Section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Monthly Usage</h3>
          <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: '600', color: '#3b82f6' }}>Coming Soon</p>
        </div>
        
        <div style={{
          background: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💰</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Current Bill</h3>
          <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>Coming Soon</p>
        </div>
        
        <div style={{
          background: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏠</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Household Devices</h3>
          <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: '600', color: '#8b5cf6' }}>Coming Soon</p>
        </div>
        
        <div style={{
          background: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏰</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Peak Hours</h3>
          <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: '600', color: '#f59e0b' }}>4:00 PM - 9:00 PM</p>
        </div>
      </section>

      {/* Features Overview */}
      <section style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
        marginBottom: '40px'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '32px',
          color: '#1e293b',
          fontSize: '2rem'
        }}>
          🚀 What You Can Do
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🔌
            </div>
            <h3 style={{ color: '#1e293b', marginBottom: '12px' }}>Manage Devices</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6' }}>
              Add and track all your household devices with automatic kWh calculations and smart sharing options.
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #10b981, #047857)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📈
            </div>
            <h3 style={{ color: '#1e293b', marginBottom: '12px' }}>Track Usage</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6' }}>
              Log energy usage with automatic TOU-D-PRIME rate calculations and detailed cost breakdowns.
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              💳
            </div>
            <h3 style={{ color: '#1e293b', marginBottom: '12px' }}>Split Bills</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6' }}>
              Fairly allocate electricity costs between family members based on actual usage patterns.
            </p>
          </div>
        </div>
      </section>

      {/* Rate Information */}
      <section style={{
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        padding: '32px',
        borderRadius: '16px',
        marginBottom: '40px'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '24px',
          color: '#92400e'
        }}>
          ⏰ Current Rate Periods
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #22c55e'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🟢</div>
            <strong style={{ color: '#15803d' }}>Off-Peak</strong>
            <div style={{ fontSize: '0.9rem', color: '#166534' }}>$0.25/kWh</div>
          </div>
          
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #ef4444'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔴</div>
            <strong style={{ color: '#dc2626' }}>On-Peak</strong>
            <div style={{ fontSize: '0.9rem', color: '#991b1b' }}>$0.55/kWh</div>
          </div>
          
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #f59e0b'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🟡</div>
            <strong style={{ color: '#d97706' }}>Mid-Peak</strong>
            <div style={{ fontSize: '0.9rem', color: '#92400e' }}>$0.37/kWh</div>
          </div>
          
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #3b82f6'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔵</div>
            <strong style={{ color: '#1d4ed8' }}>Super Off-Peak</strong>
            <div style={{ fontSize: '0.9rem', color: '#1e40af' }}>$0.24/kWh</div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h2 style={{
          marginBottom: '24px',
          color: '#1e293b'
        }}>
          🚀 Quick Actions
        </h2>
        
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            🔌 Add Device
          </button>
          
          <button style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            📈 Log Usage
          </button>
          
          <button style={{
            padding: '12px 24px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            💳 Split Bill
          </button>
          
          <button 
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        color: '#64748b',
        borderTop: '1px solid #e2e8f0'
      }}>
        <p style={{ margin: '0' }}>
          🏠 Mai Family Energy Tracker • Built with React & Supabase • TOU-D-PRIME Rate Structure
        </p>
      </footer>
    </div>
  )
}
