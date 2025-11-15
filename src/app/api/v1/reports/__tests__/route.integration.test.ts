import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

describe('Reports API Integration Tests', () => {
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

  describe('GET /api/v1/reports', () => {
    it('should return paginated reports', async () => {
      const mockReports = [
        {
          id: 'report-1',
          name: 'Test Report 1',
          description: 'Description 1',
          source_type: 'powerbi',
          space_id: 'space-1',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'report-2',
          name: 'Test Report 2',
          description: 'Description 2',
          source_type: 'grafana',
          space_id: 'space-1',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockReports })
        .mockResolvedValueOnce({ rows: [{ total: '2' }] })

      const request = new NextRequest('http://localhost:3000/api/v1/reports?page=1&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(2)
      expect(data.total).toBe(2)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(20)
    })

    it('should filter reports by sourceType', async () => {
      const mockReports = [
        {
          id: 'report-1',
          name: 'Power BI Report',
          source_type: 'powerbi',
          space_id: 'space-1',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockReports })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })

      const request = new NextRequest('http://localhost:3000/api/v1/reports?sourceType=powerbi')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('source_type'),
        expect.any(Array)
      )
    })

    it('should search reports by name', async () => {
      const mockReports = [
        {
          id: 'report-1',
          name: 'Search Result',
          source_type: 'builtin',
          space_id: 'space-1',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockReports })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })

      const request = new NextRequest('http://localhost:3000/api/v1/reports?search=Search')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.any(Array)
      )
    })

    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/reports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 when permission denied', async () => {
      ;(checkPermission as jest.Mock).mockResolvedValue({
        allowed: false,
        reason: 'Insufficient permissions',
      })

      const request = new NextRequest('http://localhost:3000/api/v1/reports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  describe('POST /api/v1/reports', () => {
    it('should create a new report', async () => {
      const newReport = {
        name: 'New Report',
        description: 'Report description',
        sourceType: 'builtin',
        spaceId: 'space-1',
      }

      const mockCreatedReport = {
        id: 'report-new',
        ...newReport,
        created_at: new Date(),
        updated_at: new Date(),
      }

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [mockCreatedReport] })

      const request = new NextRequest('http://localhost:3000/api/v1/reports', {
        method: 'POST',
        body: JSON.stringify(newReport),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe(newReport.name)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.any(Array)
      )
    })

    it('should validate required fields', async () => {
      const invalidReport = {
        description: 'Missing name',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/reports', {
        method: 'POST',
        body: JSON.stringify(invalidReport),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })
})

