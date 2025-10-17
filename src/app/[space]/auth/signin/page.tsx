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
        // On success, send them into the space
        router.push(`/${params.space}/dashboard`)
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="w-[70%] relative bg-muted">
        {loginImageUrl ? (
          <img src={loginImageUrl} alt="Login" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="w-[30%] flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">Access this workspace</CardDescription>
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => signIn('google', { callbackUrl: `/${params.space}/dashboard` })} disabled={isLoading}>
                Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


