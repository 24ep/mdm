'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { loadBrandingConfig } from '@/lib/branding'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [ssoProviders, setSsoProviders] = useState({ google: false, azure: false })
  const [loginBgStyle, setLoginBgStyle] = useState<React.CSSProperties>({})
  const [loginBgVideo, setLoginBgVideo] = useState<string | undefined>(undefined)
  const router = useRouter()

  // Load branding config for login background
  useEffect(() => {
    loadBrandingConfig().then((branding) => {
      // Check for security settings (assuming they might be merged into branding or we fetch separately)
      // Since security settings are system settings, we probably need to fetch system settings here too.
      // But for now, let's assume we can fetch settings or use a separate API call.
      
      // Fetch system settings for security
      fetch('/api/settings')
        .then(res => res.json())
        .then(settings => {
          if (settings.secureLoginPage !== false) { // Default to true if not set
            const handleContextMenu = (e: MouseEvent) => e.preventDefault()
            const handleKeyDown = (e: KeyboardEvent) => {
              // Block F12
              if (e.key === 'F12') {
                e.preventDefault()
              }
              // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
              if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
                e.preventDefault()
              }
              // Block Ctrl+U (View Source)
              if (e.ctrlKey && e.key === 'u') {
                e.preventDefault()
              }
            }
            
            document.addEventListener('contextmenu', handleContextMenu)
            document.addEventListener('keydown', handleKeyDown)
            
            return () => {
              document.removeEventListener('contextmenu', handleContextMenu)
              document.removeEventListener('keydown', handleKeyDown)
            }
          }
        })
        .catch(console.error)

      if (branding?.loginBackground) {
        const bg = branding.loginBackground
        let style: React.CSSProperties = {}
        let videoUrl: string | undefined
        
        if (bg.type === 'color' && bg.color) {
          style.backgroundColor = bg.color
        } else if (bg.type === 'gradient' && bg.gradient) {
          style.background = `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})`
        } else if (bg.type === 'image' && bg.image) {
          style.backgroundImage = `url(${bg.image})`
          style.backgroundSize = 'cover'
          style.backgroundPosition = 'center'
        } else if (bg.type === 'video' && bg.video) {
            videoUrl = bg.video
        }
        
        setLoginBgStyle(style)
        setLoginBgVideo(videoUrl)
      }
    })
  }, [])

  useEffect(() => {
    // Fetch enabled SSO providers
    fetch('/api/auth/sso-providers')
      .then(res => res.json())
      .then(data => setSsoProviders(data))
      .catch(err => console.error('Error fetching SSO providers:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Sign in with NextAuth.js
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        // Platform login - redirect to overview page
        router.push('/')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      // Platform login - redirect to overview page
      await signIn('google', { callbackUrl: '/' })
    } catch (error) {
      setError('An error occurred with Google sign-in.')
    }
  }

  const handleAzureSignIn = async () => {
    try {
      // Platform login - redirect to overview page
      await signIn('azure-ad', { callbackUrl: '/' })
    } catch (error) {
      setError('An error occurred with Azure sign-in.')
    }
  }

  const hasAnySSO = ssoProviders.google || ssoProviders.azure

  // Get application name from branding or use default
  const [appName, setAppName] = useState('Unified Data Platform')
  useEffect(() => {
    loadBrandingConfig().then((branding) => {
      if (branding?.applicationName) {
        setAppName(branding.applicationName)
      }
    })
  }, [])

  return (
    <div className="min-h-screen flex">
      {/* Left side - Background Image (70%) */}
      <div className="w-[70%] relative" style={loginBgStyle}>
        {loginBgVideo && (
            <video 
                src={loginBgVideo} 
                className="absolute inset-0 w-full h-full object-cover" 
                autoPlay 
                muted 
                loop 
                playsInline 
            />
        )}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h1 className="text-4xl font-bold mb-4">Welcome to {appName}</h1>
            <p className="text-xl opacity-90">Streamline your event organization with powerful unified data platform</p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form (30%) */}
      <div className="w-[30%] flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-sm border-0 shadow-none bg-transparent">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Sign in
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {hasAnySSO && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {ssoProviders.google && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                  )}

                  {ssoProviders.azure && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleAzureSignIn}
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                      </svg>
                      Microsoft Azure
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}