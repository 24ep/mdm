'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  GitBranch, 
  ArrowLeft, 
  Settings,
  Eye,
  Grid3X3
} from 'lucide-react'
import Link from 'next/link'

interface ERDNavigationProps {
  modelCount: number
  relationshipCount: number
  attributeCount: number
  onToggleGrid: () => void
  showGrid: boolean
  onAutoLayout: () => void
  onSaveLayout: () => void
  saving: boolean
}

export default function ERDNavigation({
  modelCount,
  relationshipCount,
  attributeCount,
  onToggleGrid,
  showGrid,
  onAutoLayout,
  onSaveLayout,
  saving
}: ERDNavigationProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Link href="/data/models">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Models
          </Button>
        </Link>
        
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          <h1 className="text-2xl font-bold">ERD Diagram</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleGrid}
        >
          {showGrid ? <Eye className="h-4 w-4 mr-2" /> : <Grid3X3 className="h-4 w-4 mr-2" />}
          {showGrid ? 'Hide' : 'Show'} Grid
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onAutoLayout}
        >
          <GitBranch className="h-4 w-4 mr-2" />
          Auto Layout
        </Button>
        
        <Button
          size="sm"
          onClick={onSaveLayout}
          disabled={saving}
        >
          <Settings className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>
    </div>
  )
}

export function ERDStats({ 
  modelCount, 
  relationshipCount, 
  attributeCount 
}: { 
  modelCount: number
  relationshipCount: number
  attributeCount: number 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium">Models</p>
              <p className="text-2xl font-bold">{modelCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium">Relationships</p>
              <p className="text-2xl font-bold">{relationshipCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium">Total Attributes</p>
              <p className="text-2xl font-bold">{attributeCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium">Primary Keys</p>
              <p className="text-2xl font-bold">
                {/* This would need to be calculated from the actual data */}
                0
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
