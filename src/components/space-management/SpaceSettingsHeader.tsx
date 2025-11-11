'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, ExternalLink, Grid3X3, CheckCircle2, Circle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SpaceSettingsHeaderProps {
  spaceName: string
  spaceDescription?: string | null
  isActive?: boolean
  homepage?: { path: string } | null
  spaceSlug?: string
  spaceId?: string
}

export function SpaceSettingsHeader({
  spaceName,
  spaceDescription,
  isActive,
  homepage,
  spaceSlug,
  spaceId
}: SpaceSettingsHeaderProps) {
  const router = useRouter()

  return (
    <div className="border-b bg-background px-6 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">
              {spaceName}
            </h1>
            {isActive !== undefined && (
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={
                  isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-muted text-foreground"
                }
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <Circle className="h-3 w-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
            )}
          </div>
          {spaceDescription && (
            <p className="text-sm text-muted-foreground">
              {spaceDescription}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/spaces')}
            className="flex items-center gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Back to Spaces
          </Button>
          <Button
            variant={homepage ? 'default' : 'outline'}
            size="sm"
            disabled={!homepage}
            onClick={() => {
              if (!homepage) return
              const base = spaceSlug || spaceId
              if (base) {
                router.push(`/${base}${homepage.path}`)
              }
            }}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {homepage ? 'Go to Space' : 'No homepage'}
          </Button>
        </div>
      </div>
    </div>
  )
}