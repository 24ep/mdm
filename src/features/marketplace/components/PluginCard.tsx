'use client'

import { PluginDefinition } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Download, ExternalLink, CheckCircle2 } from 'lucide-react'

export interface PluginCardProps {
  plugin: PluginDefinition
  onInstall: () => void
  installing?: boolean
  installed?: boolean
}

export function PluginCard({ plugin, onInstall, installing = false, installed = false }: PluginCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              {plugin.verified && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <CardDescription>{plugin.description}</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">{plugin.category}</Badge>
          {plugin.rating && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{plugin.rating.toFixed(1)}</span>
              {plugin.reviewCount && plugin.reviewCount > 0 && (
                <span className="text-xs">({plugin.reviewCount})</span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {plugin.installationCount || 0} installations
          </div>
          <div className="flex items-center gap-2">
            {plugin.documentationUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(plugin.documentationUrl, '_blank')
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {installed ? (
              <Badge variant="outline">Installed</Badge>
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onInstall()
                }}
                disabled={installing}
              >
                <Download className="mr-2 h-4 w-4" />
                {installing ? 'Installing...' : 'Install'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

