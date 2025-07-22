import { useAuth } from '@/contexts/auth-context'
import { AppleSignInButton, Button, Card, GoogleSignInButton } from '@workspace/ui'
import { Input } from '@workspace/ui/components/input'
import { Loader2, Mail, Eye, EyeOff, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

// Form validation schema
interface LoginFormData {
  email: string
  password: string
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signInWithGoogle, signInWithApple, user } = useAuth()
  const navigate = useNavigate()

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setLoading(true)

    try {
      await signIn(data.email, data.password)
      navigate('/')
    } catch (err) {
      console.error('Login error:', err)
      
      // User-friendly error messages
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase()
        if (errorMessage.includes('invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (errorMessage.includes('email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.')
        } else if (errorMessage.includes('too many requests')) {
          setError('Too many login attempts. Please wait a few minutes and try again.')
        } else if (errorMessage.includes('network')) {
          setError('Connection error. Please check your internet connection and try again.')
        } else {
          setError('Unable to sign in. Please try again or contact support if the problem persists.')
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider)
    setError(null)

    try {
      if (provider === 'google') {
        await signInWithGoogle()
      } else {
        await signInWithApple()
      }
    } catch (err) {
      console.error(`${provider} sign-in error:`, err)
      
      // User-friendly error messages for social auth
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase()
        if (errorMessage.includes('popup')) {
          setError(`${provider === 'google' ? 'Google' : 'Apple'} sign-in popup was blocked. Please allow popups and try again.`)
        } else if (errorMessage.includes('cancelled')) {
          setError('Sign-in was cancelled. Please try again.')
        } else if (errorMessage.includes('network')) {
          setError('Connection error. Please check your internet connection and try again.')
        } else {
          setError(`Unable to sign in with ${provider === 'google' ? 'Google' : 'Apple'}. Please try again or use email instead.`)
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      setSocialLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <Card className="w-full max-w-md p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-primary/10 rounded-full">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Social Sign-in Buttons */}
          <div className="space-y-3">
            <GoogleSignInButton
              loading={socialLoading === 'google'}
              onClick={() => handleSocialSignIn('google')}
              disabled={loading || socialLoading !== null}
              className="w-full h-11"
            >
              Continue with Google
            </GoogleSignInButton>
            <AppleSignInButton
              loading={socialLoading === 'apple'}
              onClick={() => handleSocialSignIn('apple')}
              disabled={loading || socialLoading !== null}
              className="w-full h-11"
            >
              Continue with Apple
            </AppleSignInButton>
          </div>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
                disabled={loading || socialLoading !== null}
                className={errors.email ? 'border-destructive focus:border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  disabled={loading || socialLoading !== null}
                  className={errors.password ? 'border-destructive focus:border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading || socialLoading !== null}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={loading || socialLoading !== null || !isValid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Sign in with Email
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact{' '}
              <a 
                href="mailto:support@hiilo.com" 
                className="font-medium text-primary hover:underline"
              >
                support@hiilo.com
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}