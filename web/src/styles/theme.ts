// Mai Home Energy Tracker - Design System Theme
export const theme = {
  // Color Palette
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main primary
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // Secondary Colors
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7', // Main secondary
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    
    // Energy Rate Colors
    energy: {
      offPeak: '#22c55e',      // Green
      onPeak: '#ef4444',       // Red
      midPeak: '#f59e0b',      // Orange
      superOffPeak: '#3b82f6', // Blue
    },
    
    // Semantic Colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Neutral Colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Background Colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    
    // Text Colors
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      tertiary: '#94a3b8',
      inverse: '#ffffff',
    }
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // Border Radius
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    card: '0 4px 16px rgba(0, 0, 0, 0.1)',
    button: '0 4px 16px rgba(59, 130, 246, 0.3)',
  },
  
  // Breakpoints for Responsive Design
  breakpoints: {
    sm: '640px',   // Mobile landscape
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop
    xl: '1280px',  // Large desktop
    '2xl': '1536px', // Extra large
  },
  
  // Component Styles
  components: {
    button: {
      primary: {
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
        transition: 'all 0.2s ease-in-out',
      },
      secondary: {
        background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
        transition: 'all 0.2s ease-in-out',
      },
      success: {
        background: 'linear-gradient(135deg, #10b981, #047857)',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
        transition: 'all 0.2s ease-in-out',
      },
      outline: {
        background: 'transparent',
        color: '#3b82f6',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        border: '2px solid #3b82f6',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
      }
    },
    
    card: {
      default: {
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
      },
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      }
    },
    
    input: {
      default: {
        width: '100%',
        padding: '12px 16px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '1rem',
        transition: 'border-color 0.2s ease-in-out',
        outline: 'none',
        boxSizing: 'border-box' as const,
      },
      focus: {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      },
      error: {
        borderColor: '#ef4444',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
      }
    }
  },
  
  // Animation Durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // Z-Index Scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  }
}

// CSS-in-JS helper functions
export const getResponsiveStyle = (styles: { [key: string]: any }) => {
  const mediaQueries: { [key: string]: string } = {}
  
  Object.entries(styles).forEach(([breakpoint, style]) => {
    if (breakpoint === 'base') {
      Object.assign(mediaQueries, style)
    } else if (theme.breakpoints[breakpoint as keyof typeof theme.breakpoints]) {
      mediaQueries[`@media (min-width: ${theme.breakpoints[breakpoint as keyof typeof theme.breakpoints]})`] = style
    }
  })
  
  return mediaQueries
}

export const getColorWithOpacity = (color: string, opacity: number) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
}

export type Theme = typeof theme
