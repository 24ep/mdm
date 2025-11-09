/**
 * OpenMetadata API Client
 * Provides methods to interact with OpenMetadata REST API
 */

export interface OpenMetadataClientConfig {
  host: string
  apiVersion: string
  authProvider: 'basic' | 'jwt' | 'oauth' | 'saml'
  authConfig: {
    username?: string
    password?: string
    jwtToken?: string
    clientId?: string
    clientSecret?: string
  }
}

export class OpenMetadataClient {
  private config: OpenMetadataClientConfig
  private baseUrl: string

  constructor(config: OpenMetadataClientConfig) {
    this.config = config
    this.baseUrl = `${config.host}/api/${config.apiVersion}`
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.authProvider === 'basic' && this.config.authConfig.username && this.config.authConfig.password) {
      const credentials = Buffer.from(
        `${this.config.authConfig.username}:${this.config.authConfig.password}`
      ).toString('base64')
      headers['Authorization'] = `Basic ${credentials}`
    } else if (this.config.authProvider === 'jwt' && this.config.authConfig.jwtToken) {
      headers['Authorization'] = `Bearer ${this.config.authConfig.jwtToken}`
    }

    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = { ...this.getAuthHeaders(), ...options.headers }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `Request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Tables
  async getTables(params?: { limit?: number; offset?: number; fields?: string[] }) {
    return this.request(`/tables${this.buildQueryString(params)}`)
  }

  async getTable(fqn: string, fields?: string[]) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}${fields ? `?fields=${fields.join(',')}` : ''}`)
  }

  async createTable(data: any) {
    return this.request('/tables', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateTable(fqn: string, data: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteTable(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  }

  async softDeleteTable(fqn: string) {
    return this.deleteTable(fqn, false, false)
  }

  async hardDeleteTable(fqn: string) {
    return this.deleteTable(fqn, false, true)
  }

  async restoreTable(fqn: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/restore`, { method: 'PUT' })
  }

  // Table Columns
  async getTableColumns(fqn: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/columns`)
  }

  async addTableColumn(fqn: string, columnData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/columns`, {
      method: 'POST',
      body: JSON.stringify(columnData),
    })
  }

  async updateTableColumn(fqn: string, columnName: string, columnData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/columns/${encodeURIComponent(columnName)}`, {
      method: 'PATCH',
      body: JSON.stringify(columnData),
    })
  }

  async deleteTableColumn(fqn: string, columnName: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/columns/${encodeURIComponent(columnName)}`, {
      method: 'DELETE',
    })
  }

  // Table Constraints
  async getTableConstraints(fqn: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}?fields=tableConstraints`)
  }

  async addTableConstraint(fqn: string, constraintData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/tableConstraints`, {
      method: 'POST',
      body: JSON.stringify(constraintData),
    })
  }

  async updateTableConstraint(fqn: string, constraintId: string, constraintData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/tableConstraints/${constraintId}`, {
      method: 'PATCH',
      body: JSON.stringify(constraintData),
    })
  }

  async deleteTableConstraint(fqn: string, constraintId: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/tableConstraints/${constraintId}`, {
      method: 'DELETE',
    })
  }

  async getTableConstraint(fqn: string, constraintId: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/tableConstraints/${constraintId}`)
  }

  // Sample Data
  async getTableSampleData(fqn: string, limit?: number) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/sampleData${limit ? `?limit=${limit}` : ''}`)
  }

  async createTableSampleData(fqn: string, sampleData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/sampleData`, {
      method: 'POST',
      body: JSON.stringify(sampleData),
    })
  }

  async updateTableSampleData(fqn: string, sampleData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/sampleData`, {
      method: 'PUT',
      body: JSON.stringify(sampleData),
    })
  }

  async deleteTableSampleData(fqn: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/sampleData`, {
      method: 'DELETE',
    })
  }

  // Databases
  async getDatabases(params?: { limit?: number; offset?: number }) {
    return this.request(`/databases${this.buildQueryString(params)}`)
  }

  async getDatabase(fqn: string) {
    return this.request(`/databases/name/${encodeURIComponent(fqn)}`)
  }

  async createDatabase(data: any) {
    return this.request('/databases', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateDatabase(fqn: string, data: any) {
    return this.request(`/databases/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteDatabase(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/databases/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  }

  // Dashboards
  async getDashboards(params?: { limit?: number; offset?: number }) {
    return this.request(`/dashboards${this.buildQueryString(params)}`)
  }

  async getDashboard(fqn: string) {
    return this.request(`/dashboards/name/${encodeURIComponent(fqn)}`)
  }

  async createDashboard(data: any) {
    return this.request('/dashboards', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateDashboard(fqn: string, data: any) {
    return this.request(`/dashboards/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteDashboard(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/dashboards/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  }

  // Pipelines
  async getPipelines(params?: { limit?: number; offset?: number }) {
    return this.request(`/pipelines${this.buildQueryString(params)}`)
  }

  async getPipeline(fqn: string) {
    return this.request(`/pipelines/name/${encodeURIComponent(fqn)}`)
  }

  async createPipeline(data: any) {
    return this.request('/pipelines', { method: 'POST', body: JSON.stringify(data) })
  }

  async updatePipeline(fqn: string, data: any) {
    return this.request(`/pipelines/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deletePipeline(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/pipelines/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  }

  // Topics
  async getTopics(params?: { limit?: number; offset?: number }) {
    return this.request(`/topics${this.buildQueryString(params)}`)
  }

  async getTopic(fqn: string) {
    return this.request(`/topics/name/${encodeURIComponent(fqn)}`)
  }

  async createTopic(data: any) {
    return this.request('/topics', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateTopic(fqn: string, data: any) {
    return this.request(`/topics/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteTopic(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/topics/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  }

  // ML Models
  async getMLModels(params?: { limit?: number; offset?: number }) {
    return this.request(`/mlModels${this.buildQueryString(params)}`)
  }

  async getMLModel(fqn: string) {
    return this.request(`/mlModels/name/${encodeURIComponent(fqn)}`)
  }

  async createMLModel(data: any) {
    return this.request('/mlModels', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateMLModel(fqn: string, data: any) {
    return this.request(`/mlModels/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteMLModel(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/mlModels/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  }

  // Lineage
  async getLineage(fqn: string, type: 'upstream' | 'downstream' | 'both' = 'both', depth: number = 1) {
    return this.request(`/lineage/table/name/${encodeURIComponent(fqn)}?upstreamDepth=${depth}&downstreamDepth=${depth}`)
  }

  async getColumnLineage(fqn: string, columnName: string, depth: number = 1) {
    return this.request(`/lineage/table/name/${encodeURIComponent(fqn)}/column/${encodeURIComponent(columnName)}?upstreamDepth=${depth}&downstreamDepth=${depth}`)
  }

  async addLineageEdge(data: any) {
    return this.request('/lineage', { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteLineageEdge(data: any) {
    return this.request('/lineage', { method: 'DELETE', body: JSON.stringify(data) })
  }

  // Data Quality
  async getTestSuites(params?: { limit?: number; offset?: number }) {
    return this.request(`/testSuites${this.buildQueryString(params)}`)
  }

  async getTestSuite(fqn: string) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}`)
  }

  async getTestCases(testSuiteId: string) {
    return this.request(`/testCases?testSuite=${encodeURIComponent(testSuiteId)}`)
  }

  async getTestCase(id: string) {
    return this.request(`/testCases/${id}`)
  }

  async getTestResults(testCaseId: string, params?: { limit?: number; startTs?: number; endTs?: number }) {
    return this.request(`/testCases/${testCaseId}/testCaseResult${this.buildQueryString(params)}`)
  }

  async runTestSuite(fqn: string) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}/run`, { method: 'POST' })
  }

  async getTestSuiteRuns(fqn: string, params?: { limit?: number; offset?: number; startTs?: number; endTs?: number }) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}/runs${this.buildQueryString(params)}`)
  }

  async getTestSuiteRun(fqn: string, runId: string) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}/runs/${runId}`)
  }

  async createTestSuite(data: any) {
    return this.request('/testSuites', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateTestSuite(fqn: string, data: any) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteTestSuite(fqn: string) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async createTestCase(data: any) {
    return this.request('/testCases', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateTestCase(id: string, data: any) {
    return this.request(`/testCases/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteTestCase(id: string) {
    return this.request(`/testCases/${id}`, { method: 'DELETE' })
  }

  // Data Profiler
  async getTableProfile(fqn: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}?fields=profile`)
  }

  async getColumnProfile(fqn: string, columnName: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/columns/${encodeURIComponent(columnName)}?fields=profile`)
  }

  // Tags & Classifications
  async getTags(params?: { limit?: number; offset?: number }) {
    return this.request(`/tags${this.buildQueryString(params)}`)
  }

  async getClassifications(params?: { limit?: number; offset?: number }) {
    return this.request(`/classifications${this.buildQueryString(params)}`)
  }

  async getTag(fqn: string) {
    return this.request(`/tags/name/${encodeURIComponent(fqn)}`)
  }

  async createTag(data: any) {
    return this.request('/tags', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateTag(fqn: string, data: any) {
    return this.request(`/tags/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteTag(fqn: string) {
    return this.request(`/tags/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async addTagToEntity(entityType: string, fqn: string, tagFqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/tags`, {
      method: 'POST',
      body: JSON.stringify([{ tagFQN: tagFqn }]),
    })
  }

  async removeTagFromEntity(entityType: string, fqn: string, tagFqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/tags/${encodeURIComponent(tagFqn)}`, {
      method: 'DELETE',
    })
  }

  // Classifications
  async getClassification(fqn: string) {
    return this.request(`/classifications/name/${encodeURIComponent(fqn)}`)
  }

  async createClassification(data: any) {
    return this.request('/classifications', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateClassification(fqn: string, data: any) {
    return this.request(`/classifications/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteClassification(fqn: string) {
    return this.request(`/classifications/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  // Glossary & Terms
  async getGlossaries(params?: { limit?: number; offset?: number }) {
    return this.request(`/glossaries${this.buildQueryString(params)}`)
  }

  async getGlossary(fqn: string) {
    return this.request(`/glossaries/name/${encodeURIComponent(fqn)}`)
  }

  async getGlossaryTerms(glossaryFqn: string) {
    return this.request(`/glossaryTerms?glossary=${encodeURIComponent(glossaryFqn)}`)
  }

  async createGlossary(data: any) {
    return this.request('/glossaries', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateGlossary(fqn: string, data: any) {
    return this.request(`/glossaries/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteGlossary(fqn: string) {
    return this.request(`/glossaries/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async getGlossaryTerm(fqn: string) {
    return this.request(`/glossaryTerms/name/${encodeURIComponent(fqn)}`)
  }

  async createGlossaryTerm(data: any) {
    return this.request('/glossaryTerms', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateGlossaryTerm(fqn: string, data: any) {
    return this.request(`/glossaryTerms/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteGlossaryTerm(fqn: string) {
    return this.request(`/glossaryTerms/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  // Policies
  async getPolicies(params?: { limit?: number; offset?: number }) {
    return this.request(`/policies${this.buildQueryString(params)}`)
  }

  async getPolicy(fqn: string) {
    return this.request(`/policies/name/${encodeURIComponent(fqn)}`)
  }

  async createPolicy(data: any) {
    return this.request('/policies', { method: 'POST', body: JSON.stringify(data) })
  }

  async updatePolicy(fqn: string, data: any) {
    return this.request(`/policies/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deletePolicy(fqn: string) {
    return this.request(`/policies/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  // Queries
  async getQueries(params?: { limit?: number; offset?: number; entityType?: string; entityFqn?: string }) {
    return this.request(`/queries${this.buildQueryString(params)}`)
  }

  async getQuery(id: string) {
    return this.request(`/queries/${id}`)
  }

  async createQuery(data: any) {
    return this.request('/queries', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateQuery(id: string, data: any) {
    return this.request(`/queries/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteQuery(id: string) {
    return this.request(`/queries/${id}`, { method: 'DELETE' })
  }

  async getQueryUsage(queryId: string, params?: { limit?: number; startTs?: number; endTs?: number }) {
    return this.request(`/queries/${queryId}/usage${this.buildQueryString(params)}`)
  }

  // Roles
  async getRoles(params?: { limit?: number; offset?: number }) {
    return this.request(`/roles${this.buildQueryString(params)}`)
  }

  async getRole(id: string) {
    return this.request(`/roles/${id}`)
  }

  async createRole(data: any) {
    return this.request('/roles', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateRole(id: string, data: any) {
    return this.request(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteRole(id: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/roles/${id}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  }

  // Teams
  async getTeams(params?: { limit?: number; offset?: number }) {
    return this.request(`/teams${this.buildQueryString(params)}`)
  }

  async getTeam(id: string) {
    return this.request(`/teams/${id}`)
  }

  async getTeamByName(name: string) {
    return this.request(`/teams/name/${encodeURIComponent(name)}`)
  }

  async createTeam(data: any) {
    return this.request('/teams', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateTeam(id: string, data: any) {
    return this.request(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteTeam(id: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/teams/${id}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  }

  async addTeamMember(teamId: string, userId: string) {
    return this.request(`/teams/${teamId}/users`, {
      method: 'POST',
      body: JSON.stringify([{ id: userId }]),
    })
  }

  async removeTeamMember(teamId: string, userId: string) {
    return this.request(`/teams/${teamId}/users/${userId}`, { method: 'DELETE' })
  }

  async getTeamMembers(teamId: string) {
    return this.request(`/teams/${teamId}/users`)
  }

  // Users
  async getUsers(params?: { limit?: number; offset?: number; team?: string; isBot?: boolean; isAdmin?: boolean }) {
    return this.request(`/users${this.buildQueryString(params)}`)
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`)
  }

  async getUserByName(name: string) {
    return this.request(`/users/name/${encodeURIComponent(name)}`)
  }

  async createUser(data: any) {
    return this.request('/users', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteUser(id: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/users/${id}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  }

  async generateUserToken(userId: string) {
    return this.request(`/users/${userId}/generateToken`, { method: 'PUT' })
  }

  async getUserTokens(userId: string) {
    return this.request(`/users/${userId}/tokens`)
  }

  async getUserToken(userId: string, tokenId: string) {
    return this.request(`/users/${userId}/tokens/${tokenId}`)
  }

  async revokeUserToken(userId: string, tokenId: string) {
    return this.request(`/users/${userId}/revokeToken`, {
      method: 'PUT',
      body: JSON.stringify({ tokenId }),
    })
  }

  async revokeAllUserTokens(userId: string) {
    return this.request(`/users/${userId}/revokeAllTokens`, { method: 'PUT' })
  }

  // Permissions
  async getPermissions(params?: { limit?: number; offset?: number; resource?: string; action?: string }) {
    return this.request(`/permissions${this.buildQueryString(params)}`)
  }

  async getPermission(id: string) {
    return this.request(`/permissions/${id}`)
  }

  async createPermission(data: any) {
    return this.request('/permissions', { method: 'POST', body: JSON.stringify(data) })
  }

  async updatePermission(id: string, data: any) {
    return this.request(`/permissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deletePermission(id: string) {
    return this.request(`/permissions/${id}`, { method: 'DELETE' })
  }

  // Role Permissions
  async getRolePermissions(roleId: string) {
    return this.request(`/roles/${roleId}/permissions`)
  }

  async addRolePermission(roleId: string, permissionId: string) {
    return this.request(`/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify([{ id: permissionId }]),
    })
  }

  async removeRolePermission(roleId: string, permissionId: string) {
    return this.request(`/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE' })
  }

  // Team Permissions
  async getTeamPermissions(teamId: string) {
    return this.request(`/teams/${teamId}/permissions`)
  }

  async addTeamPermission(teamId: string, permissionId: string) {
    return this.request(`/teams/${teamId}/permissions`, {
      method: 'POST',
      body: JSON.stringify([{ id: permissionId }]),
    })
  }

  async removeTeamPermission(teamId: string, permissionId: string) {
    return this.request(`/teams/${teamId}/permissions/${permissionId}`, { method: 'DELETE' })
  }

  // Services & Connectors
  async getDatabaseServices(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/databaseServices${this.buildQueryString(params)}`)
  }

  async getDatabaseService(fqn: string) {
    return this.request(`/services/databaseServices/name/${encodeURIComponent(fqn)}`)
  }

  async getDashboardServices(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/dashboardServices${this.buildQueryString(params)}`)
  }

  async getDashboardService(fqn: string) {
    return this.request(`/services/dashboardServices/name/${encodeURIComponent(fqn)}`)
  }

  async createDashboardService(data: any) {
    return this.request('/services/dashboardServices', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateDashboardService(fqn: string, data: any) {
    return this.request(`/services/dashboardServices/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteDashboardService(fqn: string) {
    return this.request(`/services/dashboardServices/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async getPipelineServices(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/pipelineServices${this.buildQueryString(params)}`)
  }

  async getPipelineService(fqn: string) {
    return this.request(`/services/pipelineServices/name/${encodeURIComponent(fqn)}`)
  }

  async createPipelineService(data: any) {
    return this.request('/services/pipelineServices', { method: 'POST', body: JSON.stringify(data) })
  }

  async updatePipelineService(fqn: string, data: any) {
    return this.request(`/services/pipelineServices/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deletePipelineService(fqn: string) {
    return this.request(`/services/pipelineServices/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async getMessagingServices(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/messagingServices${this.buildQueryString(params)}`)
  }

  async getMessagingService(fqn: string) {
    return this.request(`/services/messagingServices/name/${encodeURIComponent(fqn)}`)
  }

  async createMessagingService(data: any) {
    return this.request('/services/messagingServices', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateMessagingService(fqn: string, data: any) {
    return this.request(`/services/messagingServices/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteMessagingService(fqn: string) {
    return this.request(`/services/messagingServices/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async getMetadataServices(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/metadataServices${this.buildQueryString(params)}`)
  }

  async getMetadataService(fqn: string) {
    return this.request(`/services/metadataServices/name/${encodeURIComponent(fqn)}`)
  }

  async createMetadataService(data: any) {
    return this.request('/services/metadataServices', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateMetadataService(fqn: string, data: any) {
    return this.request(`/services/metadataServices/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteMetadataService(fqn: string) {
    return this.request(`/services/metadataServices/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async createDatabaseService(data: any) {
    return this.request('/services/databaseServices', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateDatabaseService(fqn: string, data: any) {
    return this.request(`/services/databaseServices/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteDatabaseService(fqn: string) {
    return this.request(`/services/databaseServices/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async testDatabaseConnection(serviceFqn: string) {
    return this.request(`/services/databaseServices/name/${encodeURIComponent(serviceFqn)}/testConnection`, { method: 'POST' })
  }

  async testDashboardConnection(serviceFqn: string) {
    return this.request(`/services/dashboardServices/name/${encodeURIComponent(serviceFqn)}/testConnection`, { method: 'POST' })
  }

  async testPipelineConnection(serviceFqn: string) {
    return this.request(`/services/pipelineServices/name/${encodeURIComponent(serviceFqn)}/testConnection`, { method: 'POST' })
  }

  async testMessagingConnection(serviceFqn: string) {
    return this.request(`/services/messagingServices/name/${encodeURIComponent(serviceFqn)}/testConnection`, { method: 'POST' })
  }

  async testMetadataConnection(serviceFqn: string) {
    return this.request(`/services/metadataServices/name/${encodeURIComponent(serviceFqn)}/testConnection`, { method: 'POST' })
  }

  // Search
  async search(query: string, filters?: Record<string, any>, params?: { limit?: number; offset?: number }) {
    const searchParams = {
      q: query,
      ...filters,
      ...params,
    }
    return this.request(`/search/query${this.buildQueryString(searchParams)}`)
  }

  // Activity Feed
  async getFeed(entityType: string, fqn: string, params?: { limit?: number; offset?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed${this.buildQueryString(params)}`)
  }

  async createThread(entityType: string, fqn: string, data: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async postReply(entityType: string, fqn: string, threadId: string, data: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed/${threadId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateThread(entityType: string, fqn: string, threadId: string, data: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed/${threadId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteThread(entityType: string, fqn: string, threadId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed/${threadId}`, {
      method: 'DELETE',
    })
  }

  async updatePost(entityType: string, fqn: string, threadId: string, postId: string, data: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed/${threadId}/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deletePost(entityType: string, fqn: string, threadId: string, postId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed/${threadId}/posts/${postId}`, {
      method: 'DELETE',
    })
  }

  // Version History
  async getVersions(entityType: string, fqn: string, params?: { limit?: number; offset?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/versions${this.buildQueryString(params)}`)
  }

  async getVersion(entityType: string, fqn: string, version: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/versions/${version}`)
  }

  async patchVersion(entityType: string, fqn: string, version: string, data: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/versions/${version}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async compareVersions(entityType: string, fqn: string, version1: string, version2: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/versions/${version1}/compare/${version2}`)
  }

  // Ingestion & Connectors
  async getIngestionPipelines(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/ingestionPipelines${this.buildQueryString(params)}`)
  }

  async getIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}`)
  }

  async createIngestionPipeline(data: any) {
    return this.request('/services/ingestionPipelines', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateIngestionPipeline(id: string, data: any) {
    return this.request(`/services/ingestionPipelines/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}`, { method: 'DELETE' })
  }

  async triggerIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/trigger/${id}`, { method: 'POST' })
  }

  async getIngestionPipelineStatus(id: string) {
    return this.request(`/services/ingestionPipelines/status/${id}`)
  }

  async enableIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}/enable`, { method: 'PUT' })
  }

  async disableIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}/disable`, { method: 'PUT' })
  }

  async pauseIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}/pause`, { method: 'PUT' })
  }

  async resumeIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}/resume`, { method: 'PUT' })
  }

  // Webhooks & Alerts
  async getWebhooks(params?: { limit?: number; offset?: number }) {
    return this.request(`/webhooks${this.buildQueryString(params)}`)
  }

  async getWebhook(id: string) {
    return this.request(`/webhooks/${id}`)
  }

  async createWebhook(data: any) {
    return this.request('/webhooks', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateWebhook(id: string, data: any) {
    return this.request(`/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteWebhook(id: string) {
    return this.request(`/webhooks/${id}`, { method: 'DELETE' })
  }

  async testWebhook(id: string) {
    return this.request(`/webhooks/${id}/test`, { method: 'POST' })
  }

  // Workflows
  async getWorkflows(params?: { limit?: number; offset?: number }) {
    return this.request(`/workflows${this.buildQueryString(params)}`)
  }

  async getWorkflow(id: string) {
    return this.request(`/workflows/${id}`)
  }

  async createWorkflow(data: any) {
    return this.request('/workflows', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateWorkflow(id: string, data: any) {
    return this.request(`/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteWorkflow(id: string) {
    return this.request(`/workflows/${id}`, { method: 'DELETE' })
  }

  async runWorkflow(id: string) {
    return this.request(`/workflows/${id}/run`, { method: 'POST' })
  }

  async pauseWorkflow(id: string) {
    return this.request(`/workflows/${id}/pause`, { method: 'POST' })
  }

  async resumeWorkflow(id: string) {
    return this.request(`/workflows/${id}/resume`, { method: 'POST' })
  }

  async getWorkflowStatus(id: string) {
    return this.request(`/workflows/${id}/status`)
  }

  // Additional Entity Types
  async getContainers(params?: { limit?: number; offset?: number }) {
    return this.request(`/containers${this.buildQueryString(params)}`)
  }

  async getContainer(fqn: string) {
    return this.request(`/containers/name/${encodeURIComponent(fqn)}`)
  }

  async createContainer(data: any) {
    return this.request('/containers', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateContainer(fqn: string, data: any) {
    return this.request(`/containers/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteContainer(fqn: string) {
    return this.request(`/containers/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async getStoredProcedures(params?: { limit?: number; offset?: number }) {
    return this.request(`/storedProcedures${this.buildQueryString(params)}`)
  }

  async getStoredProcedure(fqn: string) {
    return this.request(`/storedProcedures/name/${encodeURIComponent(fqn)}`)
  }

  async createStoredProcedure(data: any) {
    return this.request('/storedProcedures', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateStoredProcedure(fqn: string, data: any) {
    return this.request(`/storedProcedures/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteStoredProcedure(fqn: string) {
    return this.request(`/storedProcedures/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async getDatabaseSchemas(databaseFqn: string) {
    return this.request(`/databases/name/${encodeURIComponent(databaseFqn)}/databaseSchemas`)
  }

  async getDatabaseSchema(fqn: string) {
    return this.request(`/databaseSchemas/name/${encodeURIComponent(fqn)}`)
  }

  async createDatabaseSchema(data: any) {
    return this.request('/databaseSchemas', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateDatabaseSchema(fqn: string, data: any) {
    return this.request(`/databaseSchemas/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteDatabaseSchema(fqn: string) {
    return this.request(`/databaseSchemas/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async getMetrics(params?: { limit?: number; offset?: number }) {
    return this.request(`/metrics${this.buildQueryString(params)}`)
  }

  async getMetric(fqn: string) {
    return this.request(`/metrics/name/${encodeURIComponent(fqn)}`)
  }

  async createMetric(data: any) {
    return this.request('/metrics', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateMetric(fqn: string, data: any) {
    return this.request(`/metrics/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteMetric(fqn: string) {
    return this.request(`/metrics/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async getReports(params?: { limit?: number; offset?: number }) {
    return this.request(`/reports${this.buildQueryString(params)}`)
  }

  async getReport(fqn: string) {
    return this.request(`/reports/name/${encodeURIComponent(fqn)}`)
  }

  async createReport(data: any) {
    return this.request('/reports', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateReport(fqn: string, data: any) {
    return this.request(`/reports/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteReport(fqn: string) {
    return this.request(`/reports/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  async getDataProducts(params?: { limit?: number; offset?: number }) {
    return this.request(`/dataProducts${this.buildQueryString(params)}`)
  }

  async getDataProduct(fqn: string) {
    return this.request(`/dataProducts/name/${encodeURIComponent(fqn)}`)
  }

  async createDataProduct(data: any) {
    return this.request('/dataProducts', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateDataProduct(fqn: string, data: any) {
    return this.request(`/dataProducts/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteDataProduct(fqn: string) {
    return this.request(`/dataProducts/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  // Domains
  async getDomains(params?: { limit?: number; offset?: number }) {
    return this.request(`/domains${this.buildQueryString(params)}`)
  }

  async getDomain(fqn: string) {
    return this.request(`/domains/name/${encodeURIComponent(fqn)}`)
  }

  async createDomain(data: any) {
    return this.request('/domains', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateDomain(fqn: string, data: any) {
    return this.request(`/domains/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteDomain(fqn: string) {
    return this.request(`/domains/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  // Charts
  async getCharts(params?: { limit?: number; offset?: number }) {
    return this.request(`/charts${this.buildQueryString(params)}`)
  }

  async getChart(fqn: string) {
    return this.request(`/charts/name/${encodeURIComponent(fqn)}`)
  }

  async createChart(data: any) {
    return this.request('/charts', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateChart(fqn: string, data: any) {
    return this.request(`/charts/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteChart(fqn: string) {
    return this.request(`/charts/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  // Dashboard Data Models
  async getDashboardDataModels(params?: { limit?: number; offset?: number }) {
    return this.request(`/dashboardDataModels${this.buildQueryString(params)}`)
  }

  async getDashboardDataModel(fqn: string) {
    return this.request(`/dashboardDataModels/name/${encodeURIComponent(fqn)}`)
  }

  async createDashboardDataModel(data: any) {
    return this.request('/dashboardDataModels', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateDashboardDataModel(fqn: string, data: any) {
    return this.request(`/dashboardDataModels/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteDashboardDataModel(fqn: string) {
    return this.request(`/dashboardDataModels/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  }

  // Tasks
  async getTasks(params?: { limit?: number; offset?: number; status?: string; assignee?: string }) {
    return this.request(`/tasks${this.buildQueryString(params)}`)
  }

  async getTask(id: string) {
    return this.request(`/tasks/${id}`)
  }

  async createTask(data: any) {
    return this.request('/tasks', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateTask(id: string, data: any) {
    return this.request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async resolveTask(id: string, resolution: any) {
    return this.request(`/tasks/${id}/resolve`, { method: 'POST', body: JSON.stringify(resolution) })
  }

  async closeTask(id: string) {
    return this.request(`/tasks/${id}/close`, { method: 'POST' })
  }

  // Announcements
  async getAnnouncements(params?: { limit?: number; offset?: number; active?: boolean }) {
    return this.request(`/announcements${this.buildQueryString(params)}`)
  }

  async getAnnouncement(id: string) {
    return this.request(`/announcements/${id}`)
  }

  async createAnnouncement(data: any) {
    return this.request('/announcements', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateAnnouncement(id: string, data: any) {
    return this.request(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteAnnouncement(id: string) {
    return this.request(`/announcements/${id}`, { method: 'DELETE' })
  }

  // Event Subscriptions
  async getEventSubscriptions(params?: { limit?: number; offset?: number }) {
    return this.request(`/eventSubscriptions${this.buildQueryString(params)}`)
  }

  async getEventSubscription(id: string) {
    return this.request(`/eventSubscriptions/${id}`)
  }

  async createEventSubscription(data: any) {
    return this.request('/eventSubscriptions', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateEventSubscription(id: string, data: any) {
    return this.request(`/eventSubscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteEventSubscription(id: string) {
    return this.request(`/eventSubscriptions/${id}`, { method: 'DELETE' })
  }

  // Notifications
  async getNotifications(params?: { limit?: number; offset?: number; read?: boolean }) {
    return this.request(`/notifications${this.buildQueryString(params)}`)
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'POST' })
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read/all', { method: 'POST' })
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' })
  }

  // Topic Schemas
  async getTopicSchemas(topicFqn: string) {
    return this.request(`/topics/name/${encodeURIComponent(topicFqn)}/schemas`)
  }

  async createTopicSchema(topicFqn: string, schemaData: any) {
    return this.request(`/topics/name/${encodeURIComponent(topicFqn)}/schemas`, {
      method: 'POST',
      body: JSON.stringify(schemaData),
    })
  }

  async updateTopicSchema(topicFqn: string, schemaId: string, schemaData: any) {
    return this.request(`/topics/name/${encodeURIComponent(topicFqn)}/schemas/${schemaId}`, {
      method: 'PATCH',
      body: JSON.stringify(schemaData),
    })
  }

  async deleteTopicSchema(topicFqn: string, schemaId: string) {
    return this.request(`/topics/name/${encodeURIComponent(topicFqn)}/schemas/${schemaId}`, {
      method: 'DELETE',
    })
  }

  async getTopicSchema(topicFqn: string, schemaId: string) {
    return this.request(`/topics/name/${encodeURIComponent(topicFqn)}/schemas/${schemaId}`)
  }

  // Pipeline Tasks
  async getPipelineTasks(pipelineFqn: string) {
    return this.request(`/pipelines/name/${encodeURIComponent(pipelineFqn)}/tasks`)
  }

  async getPipelineTask(pipelineFqn: string, taskId: string) {
    return this.request(`/pipelines/name/${encodeURIComponent(pipelineFqn)}/tasks/${taskId}`)
  }

  // Dashboard Charts
  async getDashboardCharts(dashboardFqn: string) {
    return this.request(`/dashboards/name/${encodeURIComponent(dashboardFqn)}/charts`)
  }

  // Advanced Search
  async searchByField(field: string, value: string, entityType?: string, params?: { limit?: number; offset?: number }) {
    const searchParams = {
      [field]: value,
      ...(entityType && { entityType }),
      ...params,
    }
    return this.request(`/search/query${this.buildQueryString(searchParams)}`)
  }

  async searchByTag(tagFqn: string, params?: { limit?: number; offset?: number }) {
    return this.searchByField('tags', tagFqn, undefined, params)
  }

  async searchByOwner(owner: string, params?: { limit?: number; offset?: number }) {
    return this.searchByField('owner', owner, undefined, params)
  }

  async searchByDomain(domain: string, params?: { limit?: number; offset?: number }) {
    return this.searchByField('domain', domain, undefined, params)
  }

  // Bulk Operations
  async bulkUpdateTags(entityType: string, fqns: string[], tagFqn: string) {
    return this.request(`/${entityType}/tags`, {
      method: 'PUT',
      body: JSON.stringify({
        fqns,
        tags: [{ tagFQN: tagFqn }],
      }),
    })
  }

  async bulkUpdateOwners(entityType: string, fqns: string[], owner: { id: string; type: string }) {
    return this.request(`/${entityType}/owners`, {
      method: 'PUT',
      body: JSON.stringify({
        fqns,
        owners: [owner],
      }),
    })
  }

  // Data Insights & Analytics
  async getDataInsights(params?: { startTs?: number; endTs?: number }) {
    return this.request(`/analytics/dataInsights${this.buildQueryString(params)}`)
  }

  async getAggregatedDataInsights(params?: { startTs?: number; endTs?: number }) {
    return this.request(`/analytics/aggregated/dataInsights${this.buildQueryString(params)}`)
  }

  async getDataInsightReport(reportId: string) {
    return this.request(`/analytics/dataInsights/reports/${reportId}`)
  }

  async createDataInsightReport(data: any) {
    return this.request('/analytics/dataInsights/reports', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateDataInsightReport(reportId: string, data: any) {
    return this.request(`/analytics/dataInsights/reports/${reportId}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteDataInsightReport(reportId: string) {
    return this.request(`/analytics/dataInsights/reports/${reportId}`, { method: 'DELETE' })
  }

  // Usage Statistics
  async getUsageStatistics(entityType: string, fqn: string, params?: { limit?: number; startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/usage${this.buildQueryString(params)}`)
  }

  async getAggregatedUsageStatistics(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/usage/aggregate${this.buildQueryString(params)}`)
  }

  // Data Observability
  async getDataObservabilityMetrics(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/observability${this.buildQueryString(params)}`)
  }

  async getDataFreshness(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/freshness`)
  }

  async getDataVolume(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/volume${this.buildQueryString(params)}`)
  }

  async getDataLatency(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/latency${this.buildQueryString(params)}`)
  }

  // Custom Properties
  async getCustomProperties(entityType: string) {
    return this.request(`/customProperties/${entityType}`)
  }

  async createCustomProperty(entityType: string, data: any) {
    return this.request(`/customProperties/${entityType}`, { method: 'POST', body: JSON.stringify(data) })
  }

  async updateCustomProperty(entityType: string, propertyName: string, data: any) {
    return this.request(`/customProperties/${entityType}/${propertyName}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteCustomProperty(entityType: string, propertyName: string) {
    return this.request(`/customProperties/${entityType}/${propertyName}`, { method: 'DELETE' })
  }

  // Suggestions
  async getSuggestions(query: string, entityType?: string) {
    const params: Record<string, any> = { q: query }
    if (entityType) params.entityType = entityType
    return this.request(`/search/suggest${this.buildQueryString(params)}`)
  }

  async getSearchFacets(params?: { entityType?: string; field?: string }) {
    return this.request(`/search/facets${this.buildQueryString(params)}`)
  }

  async getSearchAggregations(query: string, aggregations: string[], params?: Record<string, any>) {
    const searchParams = {
      q: query,
      aggregations: aggregations.join(','),
      ...params,
    }
    return this.request(`/search/aggregate${this.buildQueryString(searchParams)}`)
  }

  // Recommendations
  async getRecommendations(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/recommendations`)
  }

  async getGlobalRecommendations(params?: { limit?: number; offset?: number }) {
    return this.request(`/recommendations${this.buildQueryString(params)}`)
  }

  // KPIs & Goals
  async getKPIs(params?: { limit?: number; offset?: number }) {
    return this.request(`/kpis${this.buildQueryString(params)}`)
  }

  async getKPI(id: string) {
    return this.request(`/kpis/${id}`)
  }

  async createKPI(data: any) {
    return this.request('/kpis', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateKPI(id: string, data: any) {
    return this.request(`/kpis/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteKPI(id: string) {
    return this.request(`/kpis/${id}`, { method: 'DELETE' })
  }

  async getGoals(params?: { limit?: number; offset?: number }) {
    return this.request(`/goals${this.buildQueryString(params)}`)
  }

  async createGoal(data: any) {
    return this.request('/goals', { method: 'POST', body: JSON.stringify(data) })
  }

  async getGoal(id: string) {
    return this.request(`/goals/${id}`)
  }

  async updateGoal(id: string, data: any) {
    return this.request(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteGoal(id: string) {
    return this.request(`/goals/${id}`, { method: 'DELETE' })
  }

  // Data Contracts
  async getDataContracts(params?: { limit?: number; offset?: number; entityType?: string; entityFqn?: string }) {
    return this.request(`/dataContracts${this.buildQueryString(params)}`)
  }

  async getDataContract(id: string) {
    return this.request(`/dataContracts/${id}`)
  }

  async createDataContract(data: any) {
    return this.request('/dataContracts', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateDataContract(id: string, data: any) {
    return this.request(`/dataContracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteDataContract(id: string) {
    return this.request(`/dataContracts/${id}`, { method: 'DELETE' })
  }

  // Impact Analysis
  async getImpactAnalysis(entityType: string, fqn: string, params?: { depth?: number; direction?: 'upstream' | 'downstream' | 'both' }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/impactAnalysis${this.buildQueryString(params)}`)
  }

  async getDownstreamImpact(entityType: string, fqn: string, depth: number = 1) {
    return this.getImpactAnalysis(entityType, fqn, { depth, direction: 'downstream' })
  }

  async getUpstreamImpact(entityType: string, fqn: string, depth: number = 1) {
    return this.getImpactAnalysis(entityType, fqn, { depth, direction: 'upstream' })
  }

  // Custom Metrics & Measurement Units
  async getMeasurementUnits(params?: { limit?: number; offset?: number }) {
    return this.request(`/measurementUnits${this.buildQueryString(params)}`)
  }

  async getMeasurementUnit(id: string) {
    return this.request(`/measurementUnits/${id}`)
  }

  async createMeasurementUnit(data: any) {
    return this.request('/measurementUnits', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateMeasurementUnit(id: string, data: any) {
    return this.request(`/measurementUnits/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteMeasurementUnit(id: string) {
    return this.request(`/measurementUnits/${id}`, { method: 'DELETE' })
  }

  // Batch Operations (Extended)
  async bulkDeleteEntities(entityType: string, fqns: string[]) {
    return this.request(`/${entityType}/bulkDelete`, {
      method: 'POST',
      body: JSON.stringify({ fqns }),
    })
  }

  async bulkUpdateDescriptions(entityType: string, updates: Array<{ fqn: string; description: string }>) {
    return this.request(`/${entityType}/descriptions`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    })
  }

  async bulkUpdateOwnersExtended(entityType: string, updates: Array<{ fqn: string; owner: { id: string; type: string } }>) {
    return this.request(`/${entityType}/owners/bulk`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    })
  }

  // Export/Import
  async exportMetadata(entityType: string, fqn: string, format: 'json' | 'yaml' = 'json') {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/export?format=${format}`)
  }

  async importMetadata(entityType: string, data: any, format: 'json' | 'yaml' = 'json') {
    return this.request(`/${entityType}/import?format=${format}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async exportBulkMetadata(entityType: string, fqns: string[], format: 'json' | 'yaml' = 'json') {
    return this.request(`/${entityType}/export/bulk?format=${format}`, {
      method: 'POST',
      body: JSON.stringify({ fqns }),
    })
  }

  // Relationships
  async getRelationships(entityType: string, fqn: string, relationshipType?: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/relationships${relationshipType ? `?type=${relationshipType}` : ''}`)
  }

  async getRelationship(entityType: string, fqn: string, relationshipId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/relationships/${relationshipId}`)
  }

  async createRelationship(entityType: string, fqn: string, relationshipData: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/relationships`, {
      method: 'POST',
      body: JSON.stringify(relationshipData),
    })
  }

  async updateRelationship(entityType: string, fqn: string, relationshipId: string, relationshipData: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/relationships/${relationshipId}`, {
      method: 'PATCH',
      body: JSON.stringify(relationshipData),
    })
  }

  async deleteRelationship(entityType: string, fqn: string, relationshipId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/relationships/${relationshipId}`, {
      method: 'DELETE',
    })
  }

  // Validations
  async validateEntity(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/validate`, { method: 'POST' })
  }

  async validateBulkEntities(entityType: string, fqns: string[]) {
    return this.request(`/${entityType}/validate/bulk`, {
      method: 'POST',
      body: JSON.stringify({ fqns }),
    })
  }

  // Metadata Operations
  async getMetadataOperations(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/operations`)
  }

  async executeMetadataOperation(entityType: string, fqn: string, operation: string, params?: Record<string, any>) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/operations/${operation}`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  }

  // System
  async getSystemVersion() {
    return this.request('/system/version')
  }

  async getSystemConfig() {
    return this.request('/system/config')
  }

  async getSystemTime() {
    return this.request('/system/time')
  }

  async getSystemHealth() {
    return this.request('/system/health')
  }

  async getSystemMetrics() {
    return this.request('/system/metrics')
  }

  // Soft Delete & Restore (Generic)
  async softDeleteEntity(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}`, {
      method: 'DELETE',
      headers: { 'X-Delete-Type': 'soft' },
    })
  }

  async hardDeleteEntity(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}`, {
      method: 'DELETE',
      headers: { 'X-Delete-Type': 'hard' },
    })
  }

  async restoreEntity(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/restore`, { method: 'PUT' })
  }

  async getDeletedEntities(entityType: string, params?: { limit?: number; offset?: number }) {
    return this.request(`/${entityType}?deleted=true${this.buildQueryString(params)}`)
  }

  // Copy & Clone Operations
  async copyEntity(entityType: string, sourceFqn: string, targetFqn: string, options?: Record<string, any>) {
    return this.request(`/${entityType}/name/${encodeURIComponent(sourceFqn)}/copy`, {
      method: 'POST',
      body: JSON.stringify({ targetFqn, ...options }),
    })
  }

  async cloneEntity(entityType: string, sourceFqn: string, targetFqn: string, options?: Record<string, any>) {
    return this.request(`/${entityType}/name/${encodeURIComponent(sourceFqn)}/clone`, {
      method: 'POST',
      body: JSON.stringify({ targetFqn, ...options }),
    })
  }

  // Audit & Logging
  async getAuditLogs(params?: { limit?: number; offset?: number; entityType?: string; entityFqn?: string; userId?: string; startTs?: number; endTs?: number }) {
    return this.request(`/auditLogs${this.buildQueryString(params)}`)
  }

  async getEntityAuditLogs(entityType: string, fqn: string, params?: { limit?: number; offset?: number; startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/auditLogs${this.buildQueryString(params)}`)
  }

  async exportAuditLogs(params?: { startTs?: number; endTs?: number; format?: 'json' | 'csv' }) {
    return this.request(`/auditLogs/export${this.buildQueryString(params)}`)
  }

  // Authentication & SSO
  async getAuthProviders() {
    return this.request('/auth/providers')
  }

  async getAuthProvider(providerId: string) {
    return this.request(`/auth/providers/${providerId}`)
  }

  async createAuthProvider(data: any) {
    return this.request('/auth/providers', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateAuthProvider(providerId: string, data: any) {
    return this.request(`/auth/providers/${providerId}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteAuthProvider(providerId: string) {
    return this.request(`/auth/providers/${providerId}`, { method: 'DELETE' })
  }

  async testSSOConnection(providerId: string) {
    return this.request(`/auth/providers/${providerId}/test`, { method: 'POST' })
  }

  async getSSOConfig() {
    return this.request('/auth/sso/config')
  }

  async updateSSOConfig(data: any) {
    return this.request('/auth/sso/config', { method: 'PUT', body: JSON.stringify(data) })
  }

  async login(credentials: { username: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' })
  }

  async refreshToken(refreshToken: string) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    return this.request(`/users/${userId}/changePassword`, {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    })
  }

  async resetPassword(userId: string, newPassword: string) {
    return this.request(`/users/${userId}/resetPassword`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    })
  }

  // Settings & Configuration
  async getSettings(category?: string) {
    return this.request(`/settings${category ? `?category=${category}` : ''}`)
  }

  async getSetting(key: string) {
    return this.request(`/settings/${key}`)
  }

  async updateSetting(key: string, value: any) {
    return this.request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    })
  }

  async updateSettings(settings: Record<string, any>) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async deleteSetting(key: string) {
    return this.request(`/settings/${key}`, { method: 'DELETE' })
  }

  // Events & Streaming
  async getEvents(params?: { limit?: number; offset?: number; eventType?: string; entityType?: string; startTs?: number; endTs?: number }) {
    return this.request(`/events${this.buildQueryString(params)}`)
  }

  async getEntityEvents(entityType: string, fqn: string, params?: { limit?: number; offset?: number; startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/events${this.buildQueryString(params)}`)
  }

  async subscribeToEvents(eventTypes: string[], callback: (event: any) => void) {
    // This would typically use WebSocket or Server-Sent Events
    // For REST API, this is a placeholder for event subscription
    return this.request('/events/subscribe', {
      method: 'POST',
      body: JSON.stringify({ eventTypes }),
    })
  }

  // Utility Operations
  async getEntitySummary(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/summary`)
  }

  async getEntityStatistics(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/statistics`)
  }

  async compareEntities(entityType: string, fqn1: string, fqn2: string) {
    return this.request(`/${entityType}/compare`, {
      method: 'POST',
      body: JSON.stringify({ fqn1, fqn2 }),
    })
  }

  async getEntityDependencies(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/dependencies`)
  }

  async getEntityReferences(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/references`)
  }

  // Health & Status
  async getEntityHealth(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/health`)
  }

  async getEntityStatus(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/status`)
  }

  // Followers & Owners
  async getFollowers(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/followers`)
  }

  async addFollower(entityType: string, fqn: string, userId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/followers`, {
      method: 'PUT',
      body: JSON.stringify({ id: userId }),
    })
  }

  async removeFollower(entityType: string, fqn: string, userId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/followers/${userId}`, {
      method: 'DELETE',
    })
  }

  async getOwners(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/owners`)
  }

  async addOwner(entityType: string, fqn: string, owner: { id: string; type: string }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/owners`, {
      method: 'PUT',
      body: JSON.stringify([owner]),
    })
  }

  async removeOwner(entityType: string, fqn: string, ownerId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/owners/${ownerId}`, {
      method: 'DELETE',
    })
  }

  // Votes & Reviews
  async getVotes(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/votes`)
  }

  async addVote(entityType: string, fqn: string, vote: { updatedVoteType: 'votedUp' | 'votedDown' }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/votes`, {
      method: 'PUT',
      body: JSON.stringify(vote),
    })
  }

  async removeVote(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/votes`, {
      method: 'DELETE',
    })
  }

  async getReviews(entityType: string, fqn: string, params?: { limit?: number; offset?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/reviews${this.buildQueryString(params)}`)
  }

  async addReview(entityType: string, fqn: string, review: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    })
  }

  async updateReview(entityType: string, fqn: string, reviewId: string, review: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(review),
    })
  }

  async deleteReview(entityType: string, fqn: string, reviewId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/reviews/${reviewId}`, {
      method: 'DELETE',
    })
  }

  private buildQueryString(params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) return ''
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => query.append(key, String(v)))
        } else {
          query.append(key, String(value))
        }
      }
    })
    return query.toString() ? `?${query.toString()}` : ''
  }
}

