import { renderHook, waitFor } from '@testing-library/react'
import { useTicketActions } from '../hooks/useTicketActions'

global.fetch = jest.fn()

describe('useTicketActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create ticket successfully', async () => {
    const mockTicket = {
      id: '1',
      title: 'New Ticket',
      status: 'BACKLOG',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ticket: mockTicket }),
    })

    const { result } = renderHook(() => useTicketActions())

    const ticket = await result.current.createTicket({
      title: 'New Ticket',
      status: 'BACKLOG',
    })

    expect(ticket).toEqual(mockTicket)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/tickets',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('should update ticket successfully', async () => {
    const mockTicket = {
      id: '1',
      title: 'Updated Ticket',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ticket: mockTicket }),
    })

    const { result } = renderHook(() => useTicketActions())

    const ticket = await result.current.updateTicket('1', {
      title: 'Updated Ticket',
    })

    expect(ticket).toEqual(mockTicket)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/tickets/1',
      expect.objectContaining({
        method: 'PUT',
      })
    )
  })

  it('should delete ticket successfully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    })

    const { result } = renderHook(() => useTicketActions())

    const success = await result.current.deleteTicket('1')

    expect(success).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/tickets/1',
      expect.objectContaining({
        method: 'DELETE',
      })
    )
  })
})

