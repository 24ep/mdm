'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Building2, Search, Plus, ArrowRight, Layout, Settings } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'

interface Space {
  id: string
  name: string
  description?: string
  slug?: string
  is_default: boolean
  member_count?: number
}

export default function SpaceSelectionPage() {
  const router = useRouter()
  const { currentSpace, spaces, setCurrentSpace, isLoading, error } = useSpace()
  const [search, setSearch] = useState('')

  // If user has only one space, automatically redirect to it
  useEffect(() => {
    if (!isLoading && !error && spaces.length === 1) {
      const space = spaces[0]
      router.push(`/${space.slug || space.id}/dashboard`)
    }
  }, [isLoading, error, spaces, router])

  // If user has a current space selected, redirect to it
  useEffect(() => {
    if (!isLoading && !error && currentSpace && spaces.length > 1) {
      router.push(`/${currentSpace.slug || currentSpace.id}/dashboard`)
    }
  }, [isLoading, error, currentSpace, spaces, router])

  const filtered = spaces.filter(s => (
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  ))

  const handleSpaceSelect = (space: Space) => {
    setCurrentSpace(space)
    router.push(`/${space.slug || space.id}/dashboard`)
  }

  const handleSpaceStudio = (space: Space, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setCurrentSpace(space)
    router.push(`/${space.slug || space.id}/studio`)
  }

  const handleSpaceSettings = (space: Space, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setCurrentSpace(space)
    router.push(`/${space.slug || space.id}/settings`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading spaces...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Unable to load workspaces</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link href="/auth/signin">
              <Button>Sign in</Button>
            </Link>
            <Button variant="outline" onClick={() => router.refresh()}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Select a workspace</h1>
            <p className="text-muted-foreground">Choose a workspace to continue</p>
            <div className="mt-2">
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  System settings
                </Button>
              </Link>
            </div>
          </div>
          <div className="w-64 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workspaces..."
                className="pl-8"
              />
            </div>
            <Link href="/settings/spaces">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </Link>
          </div>
        </div>

        {filtered.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-10 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <div className="font-medium mb-1">No workspaces found</div>
              <div className="text-sm text-muted-foreground mb-4">
                {search ? 'Try adjusting your search terms' : 'Create your first workspace to get started'}
              </div>
              {!search && (
                <Link href="/settings/spaces">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create workspace
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(space => (
            <Card 
              key={space.id} 
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleSpaceSelect(space)}
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {space.name}
                    {space.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {(space.member_count || 0)} members
                  </CardDescription>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              {space.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{space.description}</p>
                </CardContent>
              )}
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => handleSpaceStudio(space, e)}
                  >
                    <Layout className="h-4 w-4 mr-2" />
                    Studio
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => handleSpaceSettings(space, e)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
