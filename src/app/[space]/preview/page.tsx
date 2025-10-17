'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Eye, Settings } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'

export default function SpacePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const { currentSpace } = useSpace()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Studio
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Preview Mode</h1>
            <p className="text-sm text-muted-foreground">
              {currentSpace?.name} • Live Preview
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Edit in Studio
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Space Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Preview Mode</h3>
              <p className="text-muted-foreground mb-6">
                This is where your customized space will be displayed. 
                The preview will show your configured sidebar, pages, and components.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push(`/${params.space}/studio`)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Back to Studio
                </Button>
                <Button variant="outline" onClick={() => router.push(`/${params.space}/dashboard`)}>
                  View Live Space
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
