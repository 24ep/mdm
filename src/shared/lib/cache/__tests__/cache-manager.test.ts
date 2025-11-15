import { CacheManager } from '../cache-manager'
import { get, set, del, delPattern } from '@/lib/redis-client'

jest.mock('@/lib/redis-client')

const mockGet = get as jest.MockedFunction<typeof get>
const mockSet = set as jest.MockedFunction<typeof set>
const mockDel = del as jest.MockedFunction<typeof del>
const mockDelPattern = delPattern as jest.MockedFunction<typeof delPattern>

describe('CacheManager', () => {
  let cacheManager: CacheManager

  beforeEach(() => {
    jest.clearAllMocks()
    cacheManager = new CacheManager()
  })

  describe('get', () => {
    it('should retrieve cached value', async () => {
      mockGet.mockResolvedValue(JSON.stringify({ data: 'test' }))

      const result = await cacheManager.get('test-key')

      expect(result).toEqual({ data: 'test' })
      expect(mockGet).toHaveBeenCalledWith('test-key')
    })

    it('should return null if key does not exist', async () => {
      mockGet.mockResolvedValue(null)

      const result = await cacheManager.get('non-existent-key')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should cache a value', async () => {
      mockSet.mockResolvedValue(undefined)

      await cacheManager.set('test-key', { data: 'test' }, 3600)

      expect(mockSet).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ data: 'test' }),
        3600
      )
    })

    it('should cache without TTL', async () => {
      mockSet.mockResolvedValue(undefined)

      await cacheManager.set('test-key', { data: 'test' })

      expect(mockSet).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ data: 'test' }),
        undefined
      )
    })
  })

  describe('delete', () => {
    it('should delete a cached value', async () => {
      mockDel.mockResolvedValue(undefined)

      await cacheManager.delete('test-key')

      expect(mockDel).toHaveBeenCalledWith('test-key')
    })
  })

  describe('clearNamespace', () => {
    it('should clear all keys in a namespace', async () => {
      mockDelPattern.mockResolvedValue(undefined)

      await cacheManager.clearNamespace('test-namespace')

      expect(mockDelPattern).toHaveBeenCalledWith('test-namespace:*')
    })
  })
})
