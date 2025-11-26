import { renderHook } from '@testing-library/react'
// @ts-ignore - waitFor is available at runtime but types may be missing
import { waitFor } from '@testing-library/react'
import { useInfrastructureInstances } from '../hooks/useInfrastructureInstances'

jest.mock('@/contexts/space-context', () => ({
  useSpace: () => ({
    currentSpace: { id: 'space-1', name: 'Test Space' },
  }),
}))

global.fetch = jest.fn()

describe('useInfrastructureInstances', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch instances successfully', async () => {
    const mockInstances = [
      {
        id: '1',
        name: 'Test Instance',
        type: 'vm',
        host: '192.168.1.1',
        status: 'online',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ instances: mockInstances }),
    })

    const { result } = renderHook(() =>
      useInfrastructureInstances({ spaceId: 'space-1' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.instances).toEqual(mockInstances)
    expect(result.current.error).toBeNull()
  })

  it('should filter by type', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ instances: [] }),
    })

    const { result } = renderHook(() =>
      useInfrastructureInstances({
        spaceId: 'space-1',
        filters: { type: 'vm' },
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('type=vm')
    )
  })
})

