import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../Input'

describe('Input Component', () => {
  test('renders input with label', () => {
    render(<Input label="Email Address" />)
    
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByText('Email Address')).toBeInTheDocument()
  })

  test('renders input without label', () => {
    render(<Input placeholder="Enter text" />)
    
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  test('displays error message', () => {
    render(<Input label="Email" error="Email is required" />)
    
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toHaveStyle({ color: '#ef4444' })
  })

  test('displays helper text when no error', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />)
    
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument()
  })

  test('hides helper text when error is present', () => {
    render(
      <Input 
        label="Password" 
        helperText="Must be at least 8 characters"
        error="Password is too short"
      />
    )
    
    expect(screen.getByText('Password is too short')).toBeInTheDocument()
    expect(screen.queryByText('Must be at least 8 characters')).not.toBeInTheDocument()
  })

  test('applies error styles to input', () => {
    render(<Input error="Invalid input" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveStyle({
      borderColor: '#ef4444'
    })
  })

  test('applies small size styles', () => {
    render(<Input size="sm" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveStyle({
      padding: '8px 12px',
      fontSize: '0.875rem'
    })
  })

  test('applies large size styles', () => {
    render(<Input size="lg" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveStyle({
      padding: '16px 20px',
      fontSize: '1.125rem'
    })
  })

  test('applies filled variant styles', () => {
    render(<Input variant="filled" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveStyle({
      background: '#f9fafb'
    })
  })

  test('handles focus and blur events', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
    
    const input = screen.getByRole('textbox')
    
    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  test('handles change events', () => {
    const handleChange = jest.fn()
    
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(input).toHaveValue('test value')
  })

  test('supports different input types', () => {
    render(<Input type="password" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'password')
  })

  test('supports number input type', () => {
    render(<Input type="number" min="0" max="100" />)
    
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('type', 'number')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
  })

  test('supports email input type', () => {
    render(<Input type="email" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  test('applies custom className', () => {
    render(<Input className="custom-input" />)
    
    const container = screen.getByRole('textbox').parentElement
    expect(container).toHaveClass('custom-input')
  })

  test('forwards other props to input element', () => {
    render(<Input placeholder="Enter text" disabled required />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', 'Enter text')
    expect(input).toBeDisabled()
    expect(input).toBeRequired()
  })
})
