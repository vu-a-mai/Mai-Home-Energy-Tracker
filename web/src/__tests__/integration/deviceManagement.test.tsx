import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeviceProvider } from '../../contexts/DeviceContext'
import { AuthContext } from '../../contexts/AuthContext'
import Devices from '../../pages/Devices'

// Mock Supabase client
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          then: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    })),
    removeChannel: jest.fn()
  }
}))

// Mock hooks
jest.mock('../../hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: jest.fn()
}))

jest.mock('../../hooks/useCache', () => ({
  useCache: jest.fn(() => ({
    has: jest.fn(() => false),
    get: jest.fn(() => null),
    set: jest.fn(),
    remove: jest.fn()
  }))
}))

const mockUser = {
  id: 'test-user-id',
  email: 'test@maihome.com'
}

const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={mockAuthContext}>
    <DeviceProvider>
      {children}
    </DeviceProvider>
  </AuthContext.Provider>
)

describe('Device Management Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render device management page', async () => {
    render(
      <TestWrapper>
        <Devices />
      </TestWrapper>
    )

    expect(screen.getByText('🔌 Device Management')).toBeInTheDocument()
    expect(screen.getByText('Manage household devices and track energy consumption')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Add Device' })).toBeInTheDocument()
  })

  test('should open add device form when button is clicked', async () => {
    render(
      <TestWrapper>
        <Devices />
      </TestWrapper>
    )

    const addButton = screen.getByRole('button', { name: '+ Add Device' })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Add New Device')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Device Name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Device Type *')).toBeInTheDocument()
    expect(screen.getByLabelText('Location *')).toBeInTheDocument()
    expect(screen.getByLabelText('Power Consumption (Watts) *')).toBeInTheDocument()
  })

  test('should validate required fields in device form', async () => {
    render(
      <TestWrapper>
        <Devices />
      </TestWrapper>
    )

    // Open form
    fireEvent.click(screen.getByRole('button', { name: '+ Add Device' }))

    await waitFor(() => {
      expect(screen.getByText('Add New Device')).toBeInTheDocument()
    })

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: 'Add Device' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Device name is required')).toBeInTheDocument()
      expect(screen.getByText('Device type is required')).toBeInTheDocument()
      expect(screen.getByText('Location is required')).toBeInTheDocument()
      expect(screen.getByText('Wattage must be greater than 0')).toBeInTheDocument()
    })
  })

  test('should fill and submit device form correctly', async () => {
    render(
      <TestWrapper>
        <Devices />
      </TestWrapper>
    )

    // Open form
    fireEvent.click(screen.getByRole('button', { name: '+ Add Device' }))

    await waitFor(() => {
      expect(screen.getByText('Add New Device')).toBeInTheDocument()
    })

    // Fill form
    fireEvent.change(screen.getByLabelText('Device Name *'), {
      target: { value: 'Living Room TV' }
    })

    fireEvent.change(screen.getByLabelText('Device Type *'), {
      target: { value: 'TV' }
    })

    fireEvent.change(screen.getByLabelText('Location *'), {
      target: { value: 'Living Room' }
    })

    fireEvent.change(screen.getByLabelText('Power Consumption (Watts) *'), {
      target: { value: '150' }
    })

    // Check auto-calculated kWh display
    expect(screen.getByText('Auto-calculated: 0.150 kWh/hour')).toBeInTheDocument()

    // Check shared device toggle
    const sharedToggle = screen.getByRole('checkbox')
    expect(sharedToggle).toBeChecked() // Should be checked by default

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Add Device' })
    fireEvent.click(submitButton)

    // Form should close (assuming successful submission)
    await waitFor(() => {
      expect(screen.queryByText('Add New Device')).not.toBeInTheDocument()
    })
  })

  test('should calculate kWh correctly based on wattage input', async () => {
    render(
      <TestWrapper>
        <Devices />
      </TestWrapper>
    )

    fireEvent.click(screen.getByRole('button', { name: '+ Add Device' }))

    await waitFor(() => {
      expect(screen.getByText('Add New Device')).toBeInTheDocument()
    })

    const wattageInput = screen.getByLabelText('Power Consumption (Watts) *')

    // Test different wattage values
    fireEvent.change(wattageInput, { target: { value: '1000' } })
    expect(screen.getByText('Auto-calculated: 1.000 kWh/hour')).toBeInTheDocument()

    fireEvent.change(wattageInput, { target: { value: '500' } })
    expect(screen.getByText('Auto-calculated: 0.500 kWh/hour')).toBeInTheDocument()

    fireEvent.change(wattageInput, { target: { value: '75' } })
    expect(screen.getByText('Auto-calculated: 0.075 kWh/hour')).toBeInTheDocument()
  })

  test('should toggle between personal and shared device', async () => {
    render(
      <TestWrapper>
        <Devices />
      </TestWrapper>
    )

    fireEvent.click(screen.getByRole('button', { name: '+ Add Device' }))

    await waitFor(() => {
      expect(screen.getByText('Add New Device')).toBeInTheDocument()
    })

    const sharedToggle = screen.getByRole('checkbox')
    const helpText = screen.getByText('Costs will be split among all users')

    expect(sharedToggle).toBeChecked()
    expect(helpText).toBeInTheDocument()

    // Toggle to personal
    fireEvent.click(sharedToggle)
    expect(sharedToggle).not.toBeChecked()
    expect(screen.getByText('Costs will be assigned to you only')).toBeInTheDocument()

    // Toggle back to shared
    fireEvent.click(sharedToggle)
    expect(sharedToggle).toBeChecked()
    expect(screen.getByText('Costs will be split among all users')).toBeInTheDocument()
  })

  test('should close form when cancel button is clicked', async () => {
    render(
      <TestWrapper>
        <Devices />
      </TestWrapper>
    )

    fireEvent.click(screen.getByRole('button', { name: '+ Add Device' }))

    await waitFor(() => {
      expect(screen.getByText('Add New Device')).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText('Add New Device')).not.toBeInTheDocument()
    })
  })

  test('should display empty state when no devices exist', () => {
    render(
      <TestWrapper>
        <Devices />
      </TestWrapper>
    )

    expect(screen.getByText('No devices yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first household device to start tracking energy usage')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Your First Device' })).toBeInTheDocument()
  })
})
