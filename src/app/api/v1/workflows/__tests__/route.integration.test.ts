import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  authOptions: {},
}))

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

jest.mock('@/shared/lib/security/audit-logger', () => ({
  logAPIRequest: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/shared/lib/security/permission-checker', () => ({
  checkPermission: jest.fn().mockResolvedValue({ allowed: true }),
}))

jest.mock('../middleware', () => ({
  applyRateLimit: jest.fn().mockResolvedValue(null),
}))

import { query } from '@/lib/db'
import { checkPermission } from '@/shared/lib/security/permission-checker'

describe('Workflows API Integration Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: mockUser })
  })

  describe('GET /api/v1/workflows', () => {
    it('should return paginated workflows', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Test Workflow 1',
          description: 'Description 1',
          space_id: 'space-1',
          status: 'active',
          steps: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockWorkflows })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })

      const request = new NextRequest('http://localhost:3000/api/v1/workflows?page=1&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.total).toBe(1)
    })

    it('should filter workflows by status', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Active Workflow',
          status: 'active',
          space_id: 'space-1',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockWorkflows })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })

      const request = new NextRequest('http://localhost:3000/api/v1/workflows?status=active')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        expect.any(Array)
      )
    })

    it('should search workflows by name', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Search Result',
          status: 'active',
          space_id: 'space-1',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockWorkflows })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })

      const request = new NextRequest('http://localhost:3000/api/v1/workflows?search=Search')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
    })

    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/workflows')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/v1/workflows', () => {
    it('should create a new workflow', async () => {
      const newWorkflow = {
        name: 'New Workflow',
        description: 'Workflow description',
        spaceId: 'space-1',
        status: 'active',
        steps: [],
      }

      const mockCreatedWorkflow = {
        id: 'workflow-new',
        ...newWorkflow,
        created_at: new Date(),
        updated_at: new Date(),
      }

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [mockCreatedWorkflow] })

      const request = new NextRequest('http://localhost:3000/api/v1/workflows', {
        method: 'POST',
        body: JSON.stringify(newWorkflow),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe(newWorkflow.name)
    })
  })
})

