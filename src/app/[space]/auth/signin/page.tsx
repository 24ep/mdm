'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function SpaceSignInPage() {
  const params = useParams() as { space: string }
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginImageUrl, setLoginImageUrl] = useState<string | null>(null)
  const [ssoProviders, setSsoProviders] = useState({ google: false, azure: false })
  const [loginPageConfig, setLoginPageConfig] = useState<any>(null)

  useEffect(() => {
    const loadSpace = async () => {
      try {
        const res = await fetch(`/api/spaces/${params.space}`)
        const json = await res.json().catch(() => ({}))
        const space = json.space || null
        let features = space?.features || null
        if (typeof features === 'string') {
          try { features = JSON.parse(features) } catch { features = null }
        }
        setLoginImageUrl(features?.login_image_url || null)
      } catch {
        setLoginImageUrl(null)
      }
    }
    loadSpace()
    
    // Fetch enabled SSO providers
    fetch('/api/auth/sso-providers')
      .then(res => res.json())
      .then(data => setSsoProviders(data))
      .catch(err => console.error('Error fetching SSO providers:', err))
    
    // Fetch login page config
    fetch(`/api/spaces/${params.space}/login-config`)
      .then(res => res.json())
      .then(data => setLoginPageConfig(data.loginPageConfig))
      .catch(err => console.error('Error fetching login config:', err))
  }, [params.space])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError(result.error)
      } else {
        // Get the default page for this space from layout config
        try {
          const spaceRes = await fetch(`/api/spaces/${params.space}/default-page`)
          if (spaceRes.ok) {
            const data = await spaceRes.json()
            const defaultPath = data.path || '/dashboard'
            // Redirect to space-specific path
            router.push(`/${params.space}${defaultPath}`)
          } else {
            // Fallback to dashboard
            router.push(`/${params.space}/dashboard`)
          }
        } catch {
          // Fallback to dashboard
          router.push(`/${params.space}/dashboard`)
        }
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Get styling from config or use defaults
  const config = loginPageConfig || {}
  const leftPanelWidth = config.leftPanelWidth || '70%'
  const rightPanelWidth = config.rightPanelWidth || '30%'
  const bgType = config.backgroundType || 'gradient'
  const bgColor = config.backgroundColor || '#1e40af'
  const bgImage = config.backgroundImage || loginImageUrl
  const gradient = config.gradient || { from: '#1e40af', to: '#3b82f6', angle: 135 }
  const cardStyle = config.cardStyle || {}
  const title = config.title || 'Sign in'
  const description = config.description || 'Access this workspace'

  // Build background style
  const getBackgroundStyle = () => {
    if (bgType === 'image' && bgImage) {
      return { backgroundImage: `url(${bgImage})` }
    } else if (bgType === 'gradient') {
      return { background: `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})` }
    } else {
      return { backgroundColor: bgColor }
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="relative" style={{ width: leftPanelWidth, ...getBackgroundStyle() }}>
        {bgType === 'image' && bgImage ? (
          <img src={bgImage} alt="Login" className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="flex items-center justify-center p-8" style={{ width: rightPanelWidth, backgroundColor: cardStyle.backgroundColor || '#ffffff' }}>
        <Card 
          className="w-full max-w-sm"
          style={{
            backgroundColor: cardStyle.backgroundColor || '#ffffff',
            color: cardStyle.textColor || '#1f2937',
            borderColor: cardStyle.borderColor || '#e5e7eb',
            borderRadius: cardStyle.borderRadius !== undefined ? cardStyle.borderRadius : 8,
            boxShadow: cardStyle.shadow ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
          }}
        >
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{title}</CardTitle>
            <CardDescription className="text-center">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                  </Button>
                </div>
              </div>
              {error && <div className="text-sm text-destructive text-center">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign in'}</Button>
            </form>

            {(ssoProviders.google || ssoProviders.azure) && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {ssoProviders.google && (
                    <Button variant="outline" className="w-full" onClick={async () => {
                      try {
                        const spaceRes = await fetch(`/api/spaces/${params.space}/default-page`)
                        const defaultPath = spaceRes.ok ? (await spaceRes.json()).path : '/dashboard'
                        await signIn('google', { callbackUrl: `/${params.space}${defaultPath}` })
                      } catch {
                        await signIn('google', { callbackUrl: `/${params.space}/dashboard` })
                      }
                    }} disabled={isLoading}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                  )}
                  {ssoProviders.azure && (
                    <Button variant="outline" className="w-full" onClick={async () => {
                      try {
                        const spaceRes = await fetch(`/api/spaces/${params.space}/default-page`)
                        const defaultPath = spaceRes.ok ? (await spaceRes.json()).path : '/dashboard'
                        await signIn('azure-ad', { callbackUrl: `/${params.space}${defaultPath}` })
                      } catch {
                        await signIn('azure-ad', { callbackUrl: `/${params.space}/dashboard` })
                      }
                    }} disabled={isLoading}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
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


