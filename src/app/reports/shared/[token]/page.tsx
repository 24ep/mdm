'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, AlertCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { ReportEmbedPreview } from '@/components/reports/ReportEmbedPreview'
import type { Report } from '@/app/reports/page'

export default function SharedReportPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [requirePassword, setRequirePassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSharedReport = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/reports/shared/${token}`)
        
        if (!response.ok) {
          if (response.status === 401) {
            setRequirePassword(true)
            return
          }
          throw new Error('Failed to load shared report')
        }

        const data = await response.json()
        setReport(data.report)
      } catch (error: any) {
        setError(error.message || 'Failed to load shared report')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadSharedReport()
    }
  }, [token])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/reports/shared/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (!response.ok) {
        throw new Error('Invalid password')
      }

      const data = await response.json()
      setReport(data.report)
      setRequirePassword(false)
      toast.success('Access granted')
    } catch (error: any) {
      toast.error(error.message || 'Invalid password')
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading shared report...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (requirePassword) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password Required
              </CardTitle>
              <CardDescription>
                This report is password protected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full">
                  Access Report
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (error || !report) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || 'Report not found or link has expired'}
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push('/reports')}
              >
                Go to Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{report.name}</h1>
            <p className="text-muted-foreground">
              {report.description || 'Shared report'}
            </p>
          </div>
          {(report.embed_url || report.link) && (
            <Button
              variant="outline"
              onClick={() => {
                const url = report.embed_url || report.link
                if (url) window.open(url, '_blank')
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            {report.embed_url || report.link ? (
              <ReportEmbedPreview
                report={report}
                open={true}
                onOpenChange={() => {}}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No preview available for this report</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

