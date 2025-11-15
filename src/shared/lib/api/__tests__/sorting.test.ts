import { parseSortParams, buildOrderByClause, isValidSortField } from '../sorting'

describe('Sorting utilities', () => {
  describe('parseSortParams', () => {
    it('should parse default sort params', () => {
      const request = { url: 'http://localhost:3000/api/v1/tickets' }
      const result = parseSortParams(request)

      expect(result.sortBy).toBeUndefined()
      expect(result.sortOrder).toBe('asc')
    })

    it('should parse custom sort params', () => {
      const request = { url: 'http://localhost:3000/api/v1/tickets?sortBy=title&sortOrder=desc' }
      const result = parseSortParams(request)

      expect(result.sortBy).toBe('title')
      expect(result.sortOrder).toBe('desc')
    })

    it('should default to asc for invalid sortOrder', () => {
      const request = { url: 'http://localhost:3000/api/v1/tickets?sortOrder=invalid' }
      const result = parseSortParams(request)

      expect(result.sortOrder).toBe('asc')
    })
  })

  describe('buildOrderByClause', () => {
    it('should build ORDER BY clause with custom field', () => {
      const result = buildOrderByClause('title', 'desc')
      expect(result).toBe('ORDER BY title DESC')
    })

    it('should use default sort when field is undefined', () => {
      const result = buildOrderByClause(undefined, 'asc', { field: 'created_at', order: 'desc' })
      expect(result).toBe('ORDER BY created_at DESC')
    })

    it('should validate field and use default for invalid field', () => {
      const result = buildOrderByClause('invalid_field', 'asc')
      expect(result).toBe('ORDER BY created_at DESC')
    })
  })

  describe('isValidSortField', () => {
    it('should return true for valid field', () => {
      const allowedFields = ['title', 'created_at', 'status']
      expect(isValidSortField('title', allowedFields)).toBe(true)
    })

    it('should return false for invalid field', () => {
      const allowedFields = ['title', 'created_at', 'status']
      expect(isValidSortField('invalid', allowedFields)).toBe(false)
    })
  })
})

