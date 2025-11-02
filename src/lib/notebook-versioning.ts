/**
 * Helper functions for notebook version control
 */

export interface NotebookVersionOptions {
  notebookId: string
  notebookData: any
  commitMessage?: string
  commitDescription?: string
  branchName?: string
  tags?: string[]
  spaceId?: string
  autoCommit?: boolean // If true, automatically create version on save
}

/**
 * Automatically create a version when notebook is saved
 */
export async function autoSaveVersion(options: NotebookVersionOptions): Promise<boolean> {
  const {
    notebookId,
    notebookData,
    commitMessage = 'Auto-save',
    branchName = 'main',
    spaceId
  } = options

  try {
    // Calculate a simple change summary
    const changeSummary = {
      files_modified: ['notebook.ipynb'],
      lines_added: 0,
      lines_deleted: 0
    }

    const response = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notebook_data: notebookData,
        commit_message: commitMessage,
        commit_description: 'Automatic save',
        branch_name: branchName,
        tags: [],
        change_summary: changeSummary,
        space_id: spaceId,
        is_current: true
      })
    })

    if (!response.ok) {
      console.error('Failed to auto-save version')
      return false
    }

    return true
  } catch (error) {
    console.error('Error auto-saving version:', error)
    return false
  }
}

/**
 * Get the current version of a notebook
 */
export async function getCurrentVersion(notebookId: string): Promise<any | null> {
  try {
    const response = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/versions`)
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (data.success && data.versions) {
      const currentVersion = data.versions.find((v: any) => v.is_current)
      if (currentVersion) {
        return {
          ...currentVersion,
          notebook_data: JSON.parse(currentVersion.notebook_data)
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching current version:', error)
    return null
  }
}

/**
 * Restore a notebook to a specific version
 */
export async function restoreVersion(notebookId: string, versionId: string): Promise<any | null> {
  try {
    const response = await fetch(
      `/api/notebooks/${encodeURIComponent(notebookId)}/versions/${versionId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to restore version')
    }

    const data = await response.json()
    if (data.success && data.version) {
      return {
        ...data.version,
        notebook_data: JSON.parse(data.version.notebook_data)
      }
    }

    return null
  } catch (error) {
    console.error('Error restoring version:', error)
    return null
  }
}

/**
 * Prune old versions, keeping only the last N versions
 */
export async function pruneVersions(notebookId: string, keepCount: number = 50): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/notebooks/${encodeURIComponent(notebookId)}/versions/prune`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keep_count: keepCount })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to prune versions')
    }

    return true
  } catch (error) {
    console.error('Error pruning versions:', error)
    return false
  }
}

/**
 * Get diff between two versions
 */
export async function getVersionDiff(
  notebookId: string,
  version1Id: string,
  version2Id: string
): Promise<any | null> {
  try {
    const response = await fetch(
      `/api/notebooks/${encodeURIComponent(notebookId)}/versions/diff`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_id: notebookId,
          version1_id: version1Id,
          version2_id: version2Id
        })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get diff')
    }

    const data = await response.json()
    if (data.success && data.diff) {
      return data.diff
    }

    return null
  } catch (error) {
    console.error('Error getting diff:', error)
    return null
  }
}

