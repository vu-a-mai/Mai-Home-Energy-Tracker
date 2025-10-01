import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './globals.css'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { DeviceProvider } from './contexts/DeviceContext'
import { EnergyLogsProvider } from './contexts/EnergyLogsContext'
import { BillSplitProvider } from './contexts/BillSplitContext'
import { DemoProvider } from './contexts/DemoContext'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <DemoProvider>
        <AuthProvider>
          <DeviceProvider>
            <EnergyLogsProvider>
              <BillSplitProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <App />
                </BrowserRouter>
              </BillSplitProvider>
            </EnergyLogsProvider>
          </DeviceProvider>
        </AuthProvider>
      </DemoProvider>
    </ErrorBoundary>
  </StrictMode>,
)
