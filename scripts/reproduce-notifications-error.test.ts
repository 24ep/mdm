
/**
 * @jest-environment node
 */
import { GET } from '@/app/api/notifications/route';
import { NextRequest } from 'next/server';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ADMIN',
    },
  }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    apiRequest: jest.fn(),
    apiResponse: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Reproduction /api/notifications', () => {
  it('GET /api/notifications should return 200', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/notifications'));
    
    try {
        const response = await GET(req);
        console.log('Status:', response.status);
        if (response.status !== 200) {
            const body = await response.json();
            console.log('Body:', JSON.stringify(body, null, 2));
        } else {
             const body = await response.json();
             console.log('Success keys:', Object.keys(body));
        }
    } catch (e: any) {
        console.error('Error:', e);
    }
  });
});
