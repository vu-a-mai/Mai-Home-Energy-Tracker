import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  test('applies primary variant styles by default', () => {
    render(<Button>Primary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: '#ffffff'
    })
  })

  test('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
    })
  })

  test('applies success variant styles', () => {
    render(<Button variant="success">Success Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      background: 'linear-gradient(135deg, #10b981, #047857)'
    })
  })

  test('applies outline variant styles', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      background: 'transparent',
      color: '#3b82f6',
      border: '2px solid #3b82f6'
    })
  })

  test('applies small size styles', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      padding: '8px 16px',
      fontSize: '0.875rem'
    })
  })

  test('applies large size styles', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      padding: '16px 32px',
      fontSize: '1.125rem'
    })
  })

  test('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Clickable Button</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('disables button when disabled prop is true', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle({ opacity: '0.6' })
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('shows loading state', () => {
    render(<Button loading>Loading Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle({ opacity: '0.6' })
    
    // Check for loading spinner
    const spinner = button.querySelector('div')
    expect(spinner).toHaveStyle({
      width: '16px',
      height: '16px',
      borderRadius: '50%'
    })
  })

  test('prevents click when loading', () => {
    const handleClick = jest.fn()
    render(<Button loading onClick={handleClick}>Loading Button</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  test('supports different button types', () => {
    render(<Button type="submit">Submit Button</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  test('renders ghost variant correctly', () => {
    render(<Button variant="ghost">Ghost Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      background: 'transparent',
      border: 'none'
    })
  })
})
