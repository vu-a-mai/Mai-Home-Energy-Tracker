import { theme } from '../../styles/theme'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  color = theme.colors.primary[500],
  className = ''
}: LoadingSpinnerProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: '16px', height: '16px', borderWidth: '2px' }
      case 'lg':
        return { width: '32px', height: '32px', borderWidth: '3px' }
      default:
        return { width: '24px', height: '24px', borderWidth: '2px' }
    }
  }

  const sizeStyles = getSizeStyles()

  return (
    <>
      <div
        className={className}
        style={{
          ...sizeStyles,
          border: `${sizeStyles.borderWidth} solid ${color}20`,
          borderTop: `${sizeStyles.borderWidth} solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

export function Skeleton({ 
  width = '100%', 
  height = '20px',
  borderRadius = '4px',
  className = ''
}: SkeletonProps) {
  return (
    <>
      <div
        className={className}
        style={{
          width,
          height,
          borderRadius,
          background: `linear-gradient(90deg, ${theme.colors.gray[200]} 25%, ${theme.colors.gray[100]} 50%, ${theme.colors.gray[200]} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite'
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  )
}
