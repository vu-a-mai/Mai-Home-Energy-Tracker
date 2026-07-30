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

type AuthMode = 'login' | 'signup'

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  const { enableDemoMode } = useDemoMode()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setInviteCode(normalizeInviteCode(code))
      setMode('signup')
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
      if (mode === 'login') {
        const { data, error: loginError } = await login(email, password)
        if (loginError) throw loginError
        if (data.user) {
          if (normalizeInviteCode(inviteCode)) {
            await finishWithOptionalInvite()
          } else {
            navigate('/dashboard')
          }
        }
        return
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      const { data, error: signupError } = await signup(email, password, name)
      if (signupError) throw signupError

      if (data.session?.user) {
        await finishWithOptionalInvite()
        return
      }

      if (data.user && !data.session) {
        setInfo(
          'Account created. Check your email to confirm, then sign in' +
            (inviteCode ? ' — your invite code will stay filled in.' : '.')
        )
        setMode('login')
        return
      }

      setError('Signup did not return a user. Please try again.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
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
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-base md:text-lg">
            {mode === 'login'
              ? 'Sign in to your Mai Energy Tracker account'
              : 'Start a household, or join one with an invite code'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-1 bg-muted/30">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
                setInfo('')
              }}
              className={`rounded-md py-2 text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError('')
                setInfo('')
              }}
              className={`rounded-md py-2 text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign up
            </button>
          </div>

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
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block mb-2 font-semibold text-foreground">
                  Display name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How you appear in bill splits"
                  className="w-full"
                  autoComplete="name"
                />
              </div>
            )}

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
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                className="w-full"
                required
                minLength={mode === 'signup' ? 6 : undefined}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            <div>
              <label htmlFor="invite-code" className="block mb-2 font-semibold text-foreground">
                Invite code {mode === 'signup' ? '(optional)' : '(optional — join after sign-in)'}
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
                Leave blank to create your own household. Use a code from a household owner to join theirs.
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
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
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
