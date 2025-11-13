'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Layout, Plus, Edit } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { SpaceSettingsSidebar } from '@/components/space-management/SpaceSettingsSidebar'
import { SpaceSettingsHeader } from '@/components/space-management/SpaceSettingsHeader'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SpacesEditorManager } from '@/lib/space-studio-manager'

const defaultLayouts = [
  {
    id: 'sidebar-right-footer',
    name: 'Sidebar Right + Footer',
    description: 'Content with right sidebar and bottom footer',
    icon: Layout
  },
  {
    id: 'sidebar-left-header-top',
    name: 'Sidebar Left + Header Top',
    description: 'Classic app layout with left sidebar and top header',
    icon: Layout
  }
] as const

type LayoutTemplate = {
  id: string
  name: string
  description?: string
  allowedSpaceIds?: string[]
}

function loadTemplates(): LayoutTemplate[] {
  try {
    return JSON.parse(localStorage.getItem('space_layout_templates') || '[]')
  } catch {
    return []
  }
}

export default function LayoutSelectionPage() {
  const params = useParams() as { space: string }
  const router = useRouter()
  const spaceSlug = params.space
  const { currentSpace, spaces } = useSpace()
  const [adminTemplates, setAdminTemplates] = useState<LayoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [proposedName, setProposedName] = useState('Customer Layout 1')
  const [creating, setCreating] = useState(false)

  const selectedSpace = useMemo(() => {
    return spaces.find((s: any) => s.id === params.space || s.slug === params.space) || currentSpace
  }, [spaces, currentSpace, params.space])

  // Get homepage for "Go to Space" button
  const homepage = useMemo(() => {
    // This would typically come from editor pages, but for now return null
    return null
  }, [])

  useEffect(() => {
    const templates = loadTemplates()
    setAdminTemplates(templates)
    setLoading(false)
  }, [])

  // Get allowed layouts for this space
  const allowedLayouts = useMemo(() => {
    const spaceId = selectedSpace?.id || params.space
    
    // Get admin templates allowed for this space
    const allowedAdminTemplates = adminTemplates.filter(t => 
      !t.allowedSpaceIds || t.allowedSpaceIds.length === 0 || t.allowedSpaceIds.includes(spaceId)
    )

    // Only return admin templates (no default layouts)
    const allLayouts = allowedAdminTemplates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || '',
      icon: Layout,
      isDefault: false
    }))

    return allLayouts
  }, [adminTemplates, selectedSpace, params.space])

  const handleCreateNewLayout = () => {
    // Open name dialog with a default proposal
    ;(async () => {
      const cfg = await SpacesEditorManager.getLayoutConfig(spaceSlug)
      let base = 'Customer Layout'
      let num = 1
      if (cfg?.name && typeof cfg.name === 'string') {
        const m = String(cfg.name).match(/^(.*?)(\s(\d+))?$/)
        if (m) {
          base = (m[1] || 'Customer Layout').trim() || 'Customer Layout'
          if (m[3]) {
            const n = parseInt(m[3])
            if (!Number.isNaN(n)) num = n + 1
          }
        }
      }
      setProposedName(`${base} ${num}`)
      setCreateOpen(true)
    })()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading layouts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      <SpaceSettingsHeader
        spaceName={selectedSpace?.name || 'Space Settings'}
        spaceDescription={selectedSpace?.description}
        isActive={selectedSpace?.is_active}
        homepage={homepage}
        spaceSlug={selectedSpace?.slug}
        spaceId={selectedSpace?.id}
      />

      <div className="flex flex-1 overflow-hidden">
        <Tabs value="space-studio" onValueChange={(value) => {
          if (value !== 'space-studio') {
            router.push(`/${spaceSlug}/settings?tab=${value}`)
          }
        }}>
          <SpaceSettingsSidebar
            activeTab="space-studio"
            onTabChange={(value) => {
              if (value !== 'space-studio') {
                router.push(`/${spaceSlug}/settings?tab=${value}`)
              }
            }}
            showAllTabs={false}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <TabsContent value="space-studio" className="flex-1 overflow-auto space-y-6 p-6 m-0">
            {/* Layout Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Existing Layouts */}
              {allowedLayouts.map((layout) => {
                const Icon = layout.icon
                return (
                  <Card key={layout.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {layout.name}
                      </CardTitle>
                      <CardDescription>
                        {layout.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/${spaceSlug}/settings/layout/${layout.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
              
              {/* Create New Layout Placeholder Card */}
              <Card 
                className="hover:shadow-lg transition-shadow border-dashed border-2 border-gray-300 bg-gray-50 dark:bg-gray-800/50 cursor-pointer"
                onClick={handleCreateNewLayout}
              >
                <CardHeader className="flex items-center justify-center min-h-[120px]">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-gray-200 dark:bg-gray-700 p-3">
                        <Plus className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                    <CardTitle className="text-gray-600 dark:text-gray-400">
                      Create New Layout
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-500">
                      Start from scratch or use a template
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

          {/* Create Layout Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create layout</DialogTitle>
                <DialogDescription>Set a name for your new layout.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-xs font-medium">Layout name</label>
                <Input value={proposedName} onChange={(e) => setProposedName(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!proposedName.trim()) return
                    setCreating(true)
                    try {
                      // Create the record immediately
                      await SpacesEditorManager.saveLayoutConfig(spaceSlug, { name: proposedName.trim() })
                      setCreateOpen(false)
                      // Navigate to layout config page using the chosen name as the route param
                      router.push(`/${spaceSlug}/settings/layout/${encodeURIComponent(proposedName.trim())}`)
                    } finally {
                      setCreating(false)
                    }
                  }}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            </div>
          </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

