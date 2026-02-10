
/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/attachments/route';
import { NextRequest } from 'next/server';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ADMIN',
    },
  }),
}));

describe('Reproduction /api/admin/attachments', () => {
  it('GET /api/admin/attachments should fail', async () => {
    const req = new NextRequest(new URL('/api/admin/attachments', 'http://localhost:3000'));
    try {
        const response = await GET(req);
        console.log('Status:', response.status);
        if (response.status !== 200) {
            const body = await response.json();
            console.log('Body:', body);
        }
    } catch (e: any) {
        console.error('Error:', e);
    }
  });
});
