'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus,
  Trash2,
  ExternalLink,
  GitBranch,
  Flag,
  Tag,
  Link2,
  Search,
  Filter
} from 'lucide-react'
import { showError, showSuccess } from '@/lib/toast-utils'

interface Relationship {
  dependencies: Array<{
    id: string
    type: string
    relatedTicket: {
      id: string
      title: string
      status: string
      priority: string
    }
    createdAt: string
  }>
  dependents: Array<{
    id: string
    type: string
    relatedTicket: {
      id: string
      title: string
      status: string
      priority: string
    }
    createdAt: string
  }>
  parent: {
    id: string
    title: string
    status: string
    priority: string
  } | null
  children: Array<{
    id: string
    title: string
    status: string
    priority: string
  }>
  project: {
    id: string
    name: string
    status: string
  } | null
  milestone: {
    id: string
    name: string
    status: string
  } | null
  release: {
    id: string
    name: string
    version?: string
    status: string
  } | null
}

interface TicketRelationshipsPanelProps {
  ticketId: string
  onAddRelationship?: () => void
  onViewTicket?: (ticketId: string) => void
}

export function TicketRelationshipsPanel({
  ticketId,
  onAddRelationship,
  onViewTicket
}: TicketRelationshipsPanelProps) {
  const [relationships, setRelationships] = useState<Relationship | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadRelationships()
  }, [ticketId])

  const loadRelationships = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}/relationships`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRelationships(data.relationships)
        }
      }
    } catch (error) {
      console.error('Failed to load relationships:', error)
      toast({
        title: 'Error',
        description: 'Failed to load relationships',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRelationship = async (relationshipId: string, type: string) => {
    try {
      const response = await fetch(
        `/api/tickets/${ticketId}/relationships?relationshipId=${relationshipId}&type=${type}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        showSuccess('Relationship deleted successfully')
        loadRelationships()
      }
    } catch (error) {
      showError('Failed to delete relationship')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'BACKLOG': 'bg-gray-100 text-gray-800',
      'TODO': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'IN_REVIEW': 'bg-purple-100 text-purple-800',
      'DONE': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'BLOCKS': 'bg-red-100 text-red-800',
      'BLOCKED_BY': 'bg-orange-100 text-orange-800',
      'RELATES_TO': 'bg-blue-100 text-blue-800',
      'PARENT': 'bg-purple-100 text-purple-800',
      'CHILD': 'bg-green-100 text-green-800',
      'DUPLICATE': 'bg-yellow-100 text-yellow-800',
      'CLONES': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading relationships...</div>
        </CardContent>
      </Card>
    )
  }

  if (!relationships) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">No relationships found</div>
        </CardContent>
      </Card>
    )
  }

  const filteredDependencies = relationships.dependencies.filter(dep =>
    dep.relatedTicket.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDependents = relationships.dependents.filter(dep =>
    dep.relatedTicket.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredChildren = relationships.children.filter(child =>
    child.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Relationships</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-48"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dependencies">Dependencies</SelectItem>
                <SelectItem value="project">Project Links</SelectItem>
                <SelectItem value="milestone">Milestone Links</SelectItem>
                <SelectItem value="release">Release Links</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onAddRelationship} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dependencies */}
        {(filterType === 'all' || filterType === 'dependencies') && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Dependencies ({filteredDependencies.length})
            </h3>
            <div className="space-y-2">
              {filteredDependencies.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 border rounded">
                  No dependencies
                </div>
              ) : (
                filteredDependencies.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(dep.type)}>{dep.type}</Badge>
                        <span
                          className="font-medium cursor-pointer hover:underline"
                          onClick={() => onViewTicket?.(dep.relatedTicket.id)}
                        >
                          {dep.relatedTicket.title}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className={getStatusColor(dep.relatedTicket.status)}>
                          {dep.relatedTicket.status}
                        </Badge>
                        <Badge variant="outline">{dep.relatedTicket.priority}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRelationship(dep.id, 'dependency')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Dependents */}
        {(filterType === 'all' || filterType === 'dependencies') && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Dependents ({filteredDependents.length})
            </h3>
            <div className="space-y-2">
              {filteredDependents.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 border rounded">
                  No dependents
                </div>
              ) : (
                filteredDependents.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(dep.type)}>{dep.type}</Badge>
                        <span
                          className="font-medium cursor-pointer hover:underline"
                          onClick={() => onViewTicket?.(dep.relatedTicket.id)}
                        >
                          {dep.relatedTicket.title}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className={getStatusColor(dep.relatedTicket.status)}>
                          {dep.relatedTicket.status}
                        </Badge>
                        <Badge variant="outline">{dep.relatedTicket.priority}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRelationship(dep.id, 'dependency')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Parent */}
        {relationships.parent && (filterType === 'all' || filterType === 'dependencies') && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Parent Ticket
            </h3>
            <div className="p-3 border rounded hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span
                    className="font-medium cursor-pointer hover:underline"
                    onClick={() => onViewTicket?.(relationships.parent!.id)}
                  >
                    {relationships.parent.title}
                  </span>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className={getStatusColor(relationships.parent.status)}>
                      {relationships.parent.status}
                    </Badge>
                    <Badge variant="outline">{relationships.parent.priority}</Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteRelationship('', 'parent')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Children */}
        {(filterType === 'all' || filterType === 'dependencies') && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Subtasks ({filteredChildren.length})
            </h3>
            <div className="space-y-2">
              {filteredChildren.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 border rounded">
                  No subtasks
                </div>
              ) : (
                filteredChildren.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <span
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => onViewTicket?.(child.id)}
                      >
                        {child.title}
                      </span>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className={getStatusColor(child.status)}>
                          {child.status}
                        </Badge>
                        <Badge variant="outline">{child.priority}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRelationship(child.id, 'child')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Project Link */}
        {relationships.project && (filterType === 'all' || filterType === 'project') && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Project
            </h3>
            <div className="p-3 border rounded hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{relationships.project.name}</span>
                  <Badge variant="outline" className="ml-2">{relationships.project.status}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteRelationship('', 'project')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Link */}
        {relationships.milestone && (filterType === 'all' || filterType === 'milestone') && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Milestone
            </h3>
            <div className="p-3 border rounded hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{relationships.milestone.name}</span>
                  <Badge variant="outline" className="ml-2">{relationships.milestone.status}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteRelationship('', 'milestone')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Release Link */}
        {relationships.release && (filterType === 'all' || filterType === 'release') && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Release
            </h3>
            <div className="p-3 border rounded hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{relationships.release.name}</span>
                  {relationships.release.version && (
                    <Badge variant="outline" className="ml-2">v{relationships.release.version}</Badge>
                  )}
                  <Badge variant="outline" className="ml-2">{relationships.release.status}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteRelationship('', 'release')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

