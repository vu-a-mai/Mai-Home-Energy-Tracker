import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from '../contexts/DemoContext'
import { useNavigate, Link, useSearchParams } from 'react-router'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { BoltIcon, EyeIcon } from '@heroicons/react/24/outline'
import { acceptHouseholdInvite } from '../services/inviteService'
import {
  isValidInviteCodeFormat,
  normalizeInviteCode,
} from '../utils/householdAccess'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { enableDemoMode } = useDemoMode()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setInviteCode(normalizeInviteCode(code))
    }
  }, [searchParams])

  const finishWithOptionalInvite = async () => {
    const code = normalizeInviteCode(inviteCode)
    if (!code) {
      navigate('/dashboard')
      return
    }
    if (!isValidInviteCodeFormat(code)) {
      setError('Invite code looks invalid. You can join later from Settings.')
      navigate('/settings')
      return
    }
    try {
      const result = await acceptHouseholdInvite(code)
      if (result.joined) {
        setInfo(`Joined household as ${result.role}.`)
      }
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not join with that invite'
      setError(`${message}. You can retry from Settings → Household.`)
      navigate('/settings')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    try {
      const { data, error: loginError } = await login(email, password)
      if (loginError) throw loginError
      if (data.user) {
        if (normalizeInviteCode(inviteCode)) {
          await finishWithOptionalInvite()
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDemo = async () => {
    await enableDemoMode()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-dvh bg-background text-foreground font-sans flex items-center justify-center p-3 md:p-5 fade-in">
      <Card className="energy-card w-full max-w-lg shadow-2xl energy-glow">
        <CardHeader className="text-center pb-4 md:pb-6">
          <BoltIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-orange-400 mx-auto" />
          <CardTitle className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-base md:text-lg">
            Sign in to your Mai Energy Tracker account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-600 p-4 rounded-lg text-sm slide-up">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 p-4 rounded-lg text-sm slide-up">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-2 font-semibold text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password-input" className="block mb-2 font-semibold text-foreground">
                Password
              </label>
              <Input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full"
                required
                autoComplete="current-password"
              />
            </div>

            <div>
              <label htmlFor="invite-code" className="block mb-2 font-semibold text-foreground">
                Invite code (optional)
              </label>
              <Input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(normalizeInviteCode(e.target.value))}
                placeholder="e.g. AB12CD34"
                className="w-full uppercase tracking-wider"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Have an invite? Sign in with it filled in to join that household.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full energy-action-btn py-3 md:py-4 text-base md:text-lg font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="pt-2 md:pt-4">
            <Button
              type="button"
              onClick={handleViewDemo}
              variant="outline"
              className="w-full border-2 border-primary/50 hover:bg-primary/10 transition-all duration-300 py-3 md:py-4"
            >
              <span className="flex items-center justify-center gap-2 text-sm md:text-base">
                <EyeIcon className="w-5 h-5 md:w-6 md:h-6" />
                <span>View Demo (No Login Required)</span>
              </span>
            </Button>
          </div>

          <div className="text-center pt-4">
            <Link
              to="/"
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
