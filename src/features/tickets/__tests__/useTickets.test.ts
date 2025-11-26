import { renderHook } from '@testing-library/react'
// @ts-ignore - waitFor is available at runtime but types may be missing
import { waitFor } from '@testing-library/react'
import { useTickets } from '../hooks/useTickets'
import { useSpaceFilter } from '@/shared/hooks/useSpaceFilter'

// Mock the space context
jest.mock('@/contexts/space-context', () => ({
  useSpace: () => ({
    currentSpace: { id: 'space-1', name: 'Test Space' },
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('useTickets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch tickets successfully', async () => {
    const mockTickets = [
      {
        id: '1',
        title: 'Test Ticket',
        status: 'BACKLOG',
        priority: 'MEDIUM',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: mockTickets }),
    })

    const { result } = renderHook(() => useTickets({ spaceId: 'space-1' }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tickets).toEqual(mockTickets)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTickets({ spaceId: 'space-1' }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tickets).toEqual([])
    expect(result.current.error).toBeTruthy()
  })

  it('should filter by spaceId', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: [] }),
    })

    const { result } = renderHook(() => useTickets({ spaceId: 'space-1' }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('spaceId=space-1')
    )
  })
})

