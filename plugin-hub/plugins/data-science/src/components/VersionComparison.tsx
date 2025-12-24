'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, RotateCcw, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Version {
  id: string
  version_number: number
  commit_message: string
  created_at: string
  author?: string
  is_current: boolean
}

interface VersionComparisonProps {
  notebookId: string
  versions: Version[]
  onRestore?: (versionId: string) => void
}

export function VersionComparison({ notebookId, versions, onRestore }: VersionComparisonProps) {
  const [version1Id, setVersion1Id] = useState<string>('')
  const [version2Id, setVersion2Id] = useState<string>('')
  const [diff, setDiff] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (versions.length > 0) {
      const currentVersion = versions.find((v) => v.is_current)
      if (currentVersion) {
        setVersion2Id(currentVersion.id)
        if (versions.length > 1) {
          setVersion1Id(versions[1].id) // Previous version
        }
      }
    }
  }, [versions])

  const handleCompare = async () => {
    if (!version1Id || !version2Id) {
      toast.error('Please select both versions to compare')
      return
    }

    if (version1Id === version2Id) {
      toast.error('Please select different versions')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/versions/diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_id: notebookId,
          version1_id: version1Id,
          version2_id: version2Id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch diff')
      }

      const data = await response.json()
      if (data.success && data.diff) {
        setDiff(data.diff)
      }
    } catch (error) {
      console.error('Error comparing versions:', error)
      toast.error('Failed to compare versions')
    } finally {
      setLoading(false)
    }
  }

  const version1 = versions.find((v) => v.id === version1Id)
  const version2 = versions.find((v) => v.id === version2Id)

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Version 1 (Old)</label>
          <Select value={version1Id} onValueChange={setVersion1Id}>
            <SelectTrigger>
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version.id} value={version.id}>
                  v{version.version_number} - {version.commit_message}
                  {version.is_current && <Badge className="ml-2">Current</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Version 2 (New)</label>
          <Select value={version2Id} onValueChange={setVersion2Id}>
            <SelectTrigger>
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version.id} value={version.id}>
                  v{version.version_number} - {version.commit_message}
                  {version.is_current && <Badge className="ml-2">Current</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={handleCompare} disabled={loading || !version1Id || !version2Id}>
            <Eye className="h-4 w-4 mr-2" />
            Compare
          </Button>
        </div>
      </div>

      {diff && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Comparison Results</h3>
            <div className="text-sm text-gray-500">
              v{diff.version1.version_number} → v{diff.version2.version_number}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {diff.changes.cells_added.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cells Added</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {diff.changes.cells_modified.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cells Modified</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {diff.changes.cells_deleted.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cells Deleted</div>
            </div>
          </div>

          {diff.changes.cells_added.length > 0 && (
            <div>
              <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                Added Cells ({diff.changes.cells_added.length})
              </h4>
              <div className="space-y-1">
                {diff.changes.cells_added.slice(0, 5).map((cell: any, idx: number) => (
                  <div key={idx} className="text-sm p-2 bg-green-50 dark:bg-green-950/30 rounded">
                    + {cell.type} cell: {(cell.content || '').substring(0, 100)}
                  </div>
                ))}
                {diff.changes.cells_added.length > 5 && (
                  <div className="text-xs text-gray-500">
                    ... and {diff.changes.cells_added.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {diff.changes.cells_modified.length > 0 && (
            <div>
              <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                Modified Cells ({diff.changes.cells_modified.length})
              </h4>
              <div className="space-y-1">
                {diff.changes.cells_modified.slice(0, 5).map((change: any, idx: number) => (
                  <div key={idx} className="text-sm p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                    ~ Cell {change.cell_id}: {change.type} changed
                  </div>
                ))}
                {diff.changes.cells_modified.length > 5 && (
                  <div className="text-xs text-gray-500">
                    ... and {diff.changes.cells_modified.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {diff.changes.cells_deleted.length > 0 && (
            <div>
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                Deleted Cells ({diff.changes.cells_deleted.length})
              </h4>
              <div className="space-y-1">
                {diff.changes.cells_deleted.slice(0, 5).map((cell: any, idx: number) => (
                  <div key={idx} className="text-sm p-2 bg-red-50 dark:bg-red-950/30 rounded">
                    - {cell.type} cell: {(cell.content || '').substring(0, 100)}
                  </div>
                ))}
                {diff.changes.cells_deleted.length > 5 && (
                  <div className="text-xs text-gray-500">
                    ... and {diff.changes.cells_deleted.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {version1 && !version1.is_current && onRestore && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => onRestore(version1.id)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore Version {version1.version_number}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

