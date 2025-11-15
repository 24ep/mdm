import { RateLimiter } from '../rate-limiter'
import { get, set, incr } from '@/lib/redis-client'

jest.mock('@/lib/redis-client')

const mockGet = get as jest.MockedFunction<typeof get>
const mockSet = set as jest.MockedFunction<typeof set>
const mockIncr = incr as jest.MockedFunction<typeof incr>

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    jest.clearAllMocks()
    rateLimiter = new RateLimiter()
  })

  describe('checkLimit', () => {
    it('should allow request when under limit', async () => {
      mockGet.mockResolvedValue('5')
      mockIncr.mockResolvedValue(6)

      const result = await rateLimiter.checkLimit('user-1', {
        windowMs: 60000,
        maxRequests: 100,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(94)
    })

    it('should reject request when over limit', async () => {
      mockGet.mockResolvedValue('100')
      mockIncr.mockResolvedValue(101)

      const result = await rateLimiter.checkLimit('user-1', {
        windowMs: 60000,
        maxRequests: 100,
      })

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should set expiration on first request', async () => {
      mockGet.mockResolvedValue(null)
      mockIncr.mockResolvedValue(1)
      mockSet.mockResolvedValue(undefined)

      const result = await rateLimiter.checkLimit('user-1', {
        windowMs: 60000,
        maxRequests: 100,
      })

      expect(result.allowed).toBe(true)
      expect(mockSet).toHaveBeenCalledWith(
        'rate_limit:user-1',
        '1',
        60
      )
    })

    it('should fail open on error', async () => {
      mockGet.mockRejectedValue(new Error('Redis error'))

      const result = await rateLimiter.checkLimit('user-1', {
        windowMs: 60000,
        maxRequests: 100,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(100)
    })
  })
})

