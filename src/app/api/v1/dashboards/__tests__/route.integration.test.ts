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

describe('Dashboards API Integration Tests', () => {
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

  describe('GET /api/v1/dashboards', () => {
    it('should return paginated dashboards', async () => {
      const mockDashboards = [
        {
          id: 'dashboard-1',
          name: 'Test Dashboard 1',
          description: 'Description 1',
          space_id: 'space-1',
          layout: {},
          widgets: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockDashboards })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })

      const request = new NextRequest('http://localhost:3000/api/v1/dashboards?page=1&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.total).toBe(1)
    })

    it('should search dashboards by name', async () => {
      const mockDashboards = [
        {
          id: 'dashboard-1',
          name: 'Search Result',
          space_id: 'space-1',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockDashboards })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })

      const request = new NextRequest('http://localhost:3000/api/v1/dashboards?search=Search')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
    })

    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/dashboards')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/v1/dashboards', () => {
    it('should create a new dashboard', async () => {
      const newDashboard = {
        name: 'New Dashboard',
        description: 'Dashboard description',
        spaceId: 'space-1',
        layout: {},
        widgets: [],
      }

      const mockCreatedDashboard = {
        id: 'dashboard-new',
        ...newDashboard,
        created_at: new Date(),
        updated_at: new Date(),
      }

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [mockCreatedDashboard] })

      const request = new NextRequest('http://localhost:3000/api/v1/dashboards', {
        method: 'POST',
        body: JSON.stringify(newDashboard),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe(newDashboard.name)
    })
  })
})

