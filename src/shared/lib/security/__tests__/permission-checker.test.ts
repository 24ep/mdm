import { checkPermission } from '../permission-checker'
import { getServerSession } from 'next-auth'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

describe('checkPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow admin users', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { id: '1', role: 'ADMIN' },
    })

    const result = await checkPermission({
      resource: 'tickets',
      action: 'read',
    })

    expect(result.allowed).toBe(true)
  })

  it('should deny unauthenticated users', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValueOnce(null)

    const result = await checkPermission({
      resource: 'tickets',
      action: 'read',
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Not authenticated')
  })
})

