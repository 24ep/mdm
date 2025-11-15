import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { query } from '@/lib/db'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/db')
jest.mock('@/shared/lib/security/audit-logger')
jest.mock('@/shared/lib/security/permission-checker')
jest.mock('../middleware')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockQuery = query as jest.MockedFunction<typeof query>

describe('/api/v1/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/tickets')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return tickets for a specific space', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockTickets = [
        {
          id: 'ticket-1',
          title: 'Test Ticket',
          status: 'TODO',
          priority: 'MEDIUM',
          created_by: 'user-1',
        },
      ]

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any)
      mockQuery.mockResolvedValue(mockTickets as any)

      const request = new NextRequest('http://localhost:3000/api/v1/tickets?spaceId=space-1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tickets).toBeDefined()
    })

    it('should filter tickets by status', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockTickets = [
        {
          id: 'ticket-1',
          title: 'Test Ticket',
          status: 'TODO',
          priority: 'MEDIUM',
          created_by: 'user-1',
        },
      ]

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any)
      mockQuery.mockResolvedValue(mockTickets as any)

      const request = new NextRequest('http://localhost:3000/api/v1/tickets?status=TODO')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tickets).toBeDefined()
    })
  })

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Ticket',
          description: 'Test description',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should create a new ticket', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockTicket = {
        id: 'ticket-1',
        title: 'New Ticket',
        description: 'Test description',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        created_by: 'user-1',
      }

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any)
      mockQuery.mockResolvedValue([mockTicket] as any)

      const request = new NextRequest('http://localhost:3000/api/v1/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Ticket',
          description: 'Test description',
          spaceIds: ['space-1'],
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toBeDefined()
    })

    it('should return 400 if title is missing', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any)

      const request = new NextRequest('http://localhost:3000/api/v1/tickets', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test description',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('title')
    })
  })
})

