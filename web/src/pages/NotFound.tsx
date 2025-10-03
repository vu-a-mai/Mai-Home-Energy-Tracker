import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto min-h-[calc(100vh-200px)] bg-background text-foreground font-sans flex items-center justify-center p-3 md:p-5">
      <div className="text-center max-w-md">
        <div className="text-6xl md:text-8xl mb-4 md:mb-6 energy-pulse">⚠️</div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-foreground">
          404 - Page Not Found
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/">
          <Button className="energy-action-btn px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold">
            ← Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
