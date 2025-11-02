'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History as HistoryIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { VersionComparison } from './VersionComparison'

interface VersionsDrawerProps {
  filePath: string
  onClose: () => void
  onShowVersions?: (filePath: string) => void
}

export function VersionsDrawer({ filePath, onClose, onShowVersions }: VersionsDrawerProps) {
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/notebooks/${encodeURIComponent(filePath)}/versions`)
        if (!response.ok) {
          throw new Error('Failed to fetch versions')
        }

        const data = await response.json()
        if (data.success && data.versions) {
          setVersions(data.versions.slice(0, 20)) // Show latest 20 versions
        }
      } catch (error) {
        console.error('Error fetching versions:', error)
        toast.error('Failed to load versions')
      } finally {
        setLoading(false)
      }
    }

    fetchVersions()
  }, [filePath])

  const handleRestore = async (versionId: string) => {
    try {
      const response = await fetch(
        `/api/notebooks/${encodeURIComponent(filePath)}/versions/${versionId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to restore version')
      }

      toast.success('Version restored successfully')
      onClose()
      // Reload page or refresh notebook
      window.location.reload()
    } catch (error) {
      console.error('Error restoring version:', error)
      toast.error('Failed to restore version')
    }
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="absolute top-0 right-0 h-full w-[600px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-sm flex items-center justify-between">
          <span>Versions • {filePath}</span>
          <Button size="sm" variant="outline" onClick={() => { onShowVersions && onShowVersions(filePath); onClose() }}>
            Open History
          </Button>
        </div>
        <Tabs defaultValue="list" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="list">Version List</TabsTrigger>
            <TabsTrigger value="compare">Compare Versions</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="flex-1 overflow-y-auto p-3 space-y-2 mt-0">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HistoryIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No versions found</p>
              <p className="text-xs">Versions will appear here when you save changes</p>
            </div>
          ) : (
            versions.map((version) => {
              const date = new Date(version.created_at)
              return (
                <div
                  key={version.id}
                  className="p-3 rounded border border-gray-200 dark:border-gray-700 text-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium mb-1">
                        {version.commit_message || `Version ${version.version_number}`}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        {date.toLocaleString()}
                      </div>
                      {version.author && (
                        <div className="text-xs text-gray-500">by {version.author}</div>
                      )}
                      {version.is_current && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                  {!version.is_current && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => handleRestore(version.id)}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              )
            })
          )}
          </TabsContent>
          <TabsContent value="compare" className="flex-1 overflow-y-auto p-4 mt-0">
            <VersionComparison
              notebookId={filePath}
              versions={versions}
              onRestore={handleRestore}
            />
          </TabsContent>
        </Tabs>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          Showing latest {versions.length} version{versions.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

