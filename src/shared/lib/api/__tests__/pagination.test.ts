import { parsePaginationParams, createPaginationResponse } from '../pagination'

describe('Pagination utilities', () => {
  describe('parsePaginationParams', () => {
    it('should parse default pagination params', () => {
      const request = { url: 'http://localhost:3000/api/v1/tickets' }
      const result = parsePaginationParams(request)

      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.offset).toBe(0)
    })

    it('should parse custom pagination params', () => {
      const request = { url: 'http://localhost:3000/api/v1/tickets?page=3&limit=50' }
      const result = parsePaginationParams(request)

      expect(result.page).toBe(3)
      expect(result.limit).toBe(50)
      expect(result.offset).toBe(100)
    })

    it('should enforce maximum limit', () => {
      const request = { url: 'http://localhost:3000/api/v1/tickets?limit=200' }
      const result = parsePaginationParams(request)

      expect(result.limit).toBe(100)
    })

    it('should enforce minimum page', () => {
      const request = { url: 'http://localhost:3000/api/v1/tickets?page=0' }
      const result = parsePaginationParams(request)

      expect(result.page).toBe(1)
    })
  })

  describe('createPaginationResponse', () => {
    it('should create pagination response', () => {
      const data = [1, 2, 3, 4, 5]
      const result = createPaginationResponse(data, 25, 2, 10)

      expect(result.data).toEqual(data)
      expect(result.total).toBe(25)
      expect(result.page).toBe(2)
      expect(result.limit).toBe(10)
      expect(result.pages).toBe(3)
    })

    it('should calculate pages correctly', () => {
      const result = createPaginationResponse([], 100, 1, 20)
      expect(result.pages).toBe(5)
    })
  })
})

