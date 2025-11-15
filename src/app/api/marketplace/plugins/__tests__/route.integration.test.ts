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

jest.mock('../../middleware', () => ({
  rateLimitMiddleware: jest.fn().mockResolvedValue(null),
}))

import { query } from '@/lib/db'

describe('Marketplace Plugins API Integration Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: mockUser })
  })

  describe('GET /api/marketplace/plugins', () => {
    it('should return list of plugins', async () => {
      const mockPlugins = [
        {
          id: 'plugin-1',
          name: 'Power BI',
          slug: 'power-bi',
          description: 'Power BI integration',
          category: 'business-intelligence',
          status: 'active',
        },
        {
          id: 'plugin-2',
          name: 'Grafana',
          slug: 'grafana',
          description: 'Grafana integration',
          category: 'business-intelligence',
          status: 'active',
        },
      ]

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: mockPlugins })

      const request = new NextRequest('http://localhost:3000/api/marketplace/plugins')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it('should filter plugins by category', async () => {
      const mockPlugins = [
        {
          id: 'plugin-1',
          name: 'MinIO Management',
          category: 'service-management',
          status: 'active',
        },
      ]

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: mockPlugins })

      const request = new NextRequest('http://localhost:3000/api/marketplace/plugins?category=service-management')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('category'),
        expect.any(Array)
      )
    })

    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/marketplace/plugins')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/marketplace/plugins', () => {
    it('should register a new plugin', async () => {
      const newPlugin = {
        name: 'Test Plugin',
        slug: 'test-plugin',
        description: 'Test plugin description',
        category: 'business-intelligence',
        version: '1.0.0',
      }

      const mockCreatedPlugin = {
        id: 'plugin-new',
        ...newPlugin,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      }

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [mockCreatedPlugin] })

      const request = new NextRequest('http://localhost:3000/api/marketplace/plugins', {
        method: 'POST',
        body: JSON.stringify(newPlugin),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe(newPlugin.name)
    })
  })
})

