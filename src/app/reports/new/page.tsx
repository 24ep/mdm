'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  BarChart3,
  Save
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { useSpaces } from '@/hooks/useSpaces'
import toast from 'react-hot-toast'

export default function NewReportPage() {
  const router = useRouter()
  const { currentSpace } = useSpace()
  const { spaces, loading: spacesLoading } = useSpaces()
  const [loading, setLoading] = useState(false)

  // Default to current space if available, otherwise empty
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(currentSpace?.id || '')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    folder_id: ''
  })

  useEffect(() => {
    if (currentSpace?.id && !selectedSpaceId) {
      setSelectedSpaceId(currentSpace.id)
    }
  }, [currentSpace, selectedSpaceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Report name is required')
      return
    }

    if (!selectedSpaceId) {
      toast.error('Please select a space')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'BUILT_IN',
          space_ids: [selectedSpaceId]
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create report')
      }

      const data = await response.json()
      toast.success('Report created successfully')

      // Find the selected space to get its slug for redirection
      const selectedSpace = spaces.find(s => s.id === selectedSpaceId)
      const slug = selectedSpace?.slug || selectedSpaceId

      // Redirect to the space module/dashboard
      router.push(`/${slug}/module`)
    } catch (error: any) {
      console.error('Error creating report:', error)
      toast.error(error.message || 'Failed to create report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/reports')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                Create New Report
              </h1>
              <p className="text-muted-foreground">
                Create a new built-in visualization report
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>
              Enter the basic information for your new report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Report Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Report"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="space">Space *</Label>
                  <Select
                    value={selectedSpaceId}
                    onValueChange={setSelectedSpaceId}
                    disabled={spacesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={spacesLoading ? "Loading spaces..." : "Select a space"} />
                    </SelectTrigger>
                    <SelectContent>
                      {spaces.map(space => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Report description..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category_id">Category (Optional)</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {/* Categories would be loaded from API */}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="folder_id">Folder (Optional)</Label>
                  <Select
                    value={formData.folder_id}
                    onValueChange={(value) => setFormData({ ...formData, folder_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {/* Folders would be loaded from API */}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/reports')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Report'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
