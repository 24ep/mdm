import { Octokit } from '@octokit/rest'
import { GitLab } from '@gitbeaker/node'

export interface GitConfig {
  provider: 'github' | 'gitlab'
  repository: string
  branch: string
  filePath: string
  token: string
}

export interface GitSyncResult {
  success: boolean
  commitHash?: string
  message?: string
  error?: string
  changes?: {
    type: 'added' | 'modified' | 'deleted'
    file: string
    linesAdded?: number
    linesRemoved?: number
  }[]
}

export class GitIntegrationService {
  private config: GitConfig

  constructor(config: GitConfig) {
    this.config = config
  }

  async syncQuery(queryId: string, sql: string, message?: string): Promise<GitSyncResult> {
    try {
      if (this.config.provider === 'github') {
        return await this.syncToGitHub(queryId, sql, message)
      } else if (this.config.provider === 'gitlab') {
        return await this.syncToGitLab(queryId, sql, message)
      } else {
        throw new Error(`Unsupported Git provider: ${this.config.provider}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private async syncToGitHub(queryId: string, sql: string, message?: string): Promise<GitSyncResult> {
    const octokit = new Octokit({
      auth: this.config.token
    })

    const [owner, repo] = this.parseRepository(this.config.repository)

    try {
      // Get the current file content
      let currentContent = ''
      let currentSha = ''

      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: this.config.filePath,
          ref: this.config.branch
        })

        if ('content' in data) {
          currentContent = Buffer.from(data.content, 'base64').toString('utf-8')
          currentSha = data.sha
        }
      } catch (error: any) {
        // File doesn't exist, will create it
        if (error.status !== 404) {
          throw error
        }
      }

      // Prepare the new content
      const newContent = this.formatSQLFile(queryId, sql)
      const commitMessage = message || `Update SQL query: ${queryId}`

      // Create or update the file
      const { data } = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: this.config.filePath,
        message: commitMessage,
        content: Buffer.from(newContent).toString('base64'),
        sha: currentSha,
        branch: this.config.branch
      })

      return {
        success: true,
        commitHash: data.commit.sha,
        message: 'Query synced to GitHub successfully',
        changes: [{
          type: currentContent ? 'modified' : 'added',
          file: this.config.filePath,
          linesAdded: this.countLines(newContent),
          linesRemoved: currentContent ? this.countLines(currentContent) : 0
        }]
      }
    } catch (error: any) {
      return {
        success: false,
        error: `GitHub sync failed: ${error.message}`
      }
    }
  }

  private async syncToGitLab(queryId: string, sql: string, message?: string): Promise<GitSyncResult> {
    const gitlab = new GitLab({
      token: this.config.token
    })

    try {
      const projectId = this.parseGitLabProject(this.config.repository)
      
      // Get the current file content
      let currentContent = ''
      let currentBlobId = ''

      try {
        const file = await gitlab.RepositoryFiles.show(projectId, this.config.filePath, this.config.branch)
        currentContent = Buffer.from(file.content, 'base64').toString('utf-8')
        currentBlobId = file.blob_id
      } catch (error: any) {
        // File doesn't exist, will create it
        if (error.response?.status !== 404) {
          throw error
        }
      }

      // Prepare the new content
      const newContent = this.formatSQLFile(queryId, sql)
      const commitMessage = message || `Update SQL query: ${queryId}`

      // Create or update the file
      const result = await gitlab.RepositoryFiles.edit(projectId, {
        file_path: this.config.filePath,
        branch: this.config.branch,
        content: newContent,
        commit_message: commitMessage,
        encoding: 'text'
      })

      return {
        success: true,
        commitHash: result.id,
        message: 'Query synced to GitLab successfully',
        changes: [{
          type: currentContent ? 'modified' : 'added',
          file: this.config.filePath,
          linesAdded: this.countLines(newContent),
          linesRemoved: currentContent ? this.countLines(currentContent) : 0
        }]
      }
    } catch (error: any) {
      return {
        success: false,
        error: `GitLab sync failed: ${error.message}`
      }
    }
  }

  private parseRepository(repository: string): [string, string] {
    const match = repository.match(/github\.com[/:]([^/]+)\/([^/]+)/)
    if (!match) {
      throw new Error(`Invalid GitHub repository URL: ${repository}`)
    }
    return [match[1], match[2].replace('.git', '')]
  }

  private parseGitLabProject(repository: string): string {
    const match = repository.match(/gitlab\.com[/:]([^/]+)\/([^/]+)/)
    if (!match) {
      throw new Error(`Invalid GitLab repository URL: ${repository}`)
    }
    return `${match[1]}/${match[2].replace('.git', '')}`
  }

  private formatSQLFile(queryId: string, sql: string): string {
    const header = `-- SQL Query: ${queryId}
-- Generated: ${new Date().toISOString()}
-- Auto-synced from MDM Admin Console

`
    return header + sql
  }

  private countLines(content: string): number {
    return content.split('\n').length
  }

  async pullFromGit(): Promise<GitSyncResult> {
    try {
      if (this.config.provider === 'github') {
        return await this.pullFromGitHub()
      } else if (this.config.provider === 'gitlab') {
        return await this.pullFromGitLab()
      } else {
        throw new Error(`Unsupported Git provider: ${this.config.provider}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private async pullFromGitHub(): Promise<GitSyncResult> {
    const octokit = new Octokit({
      auth: this.config.token
    })

    const [owner, repo] = this.parseRepository(this.config.repository)

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: this.config.filePath,
        ref: this.config.branch
      })

      if ('content' in data) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8')
        return {
          success: true,
          message: 'Query pulled from GitHub successfully',
          changes: [{
            type: 'modified',
            file: this.config.filePath,
            linesAdded: this.countLines(content)
          }]
        }
      }

      return {
        success: false,
        error: 'File not found in repository'
      }
    } catch (error: any) {
      return {
        success: false,
        error: `GitHub pull failed: ${error.message}`
      }
    }
  }

  private async pullFromGitLab(): Promise<GitSyncResult> {
    const gitlab = new GitLab({
      token: this.config.token
    })

    try {
      const projectId = this.parseGitLabProject(this.config.repository)
      const file = await gitlab.RepositoryFiles.show(projectId, this.config.filePath, this.config.branch)
      
      const content = Buffer.from(file.content, 'base64').toString('utf-8')
      return {
        success: true,
        message: 'Query pulled from GitLab successfully',
        changes: [{
          type: 'modified',
          file: this.config.filePath,
          linesAdded: this.countLines(content)
        }]
      }
    } catch (error: any) {
      return {
        success: false,
        error: `GitLab pull failed: ${error.message}`
      }
    }
  }
}
