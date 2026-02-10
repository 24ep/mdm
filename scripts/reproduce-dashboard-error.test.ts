
/**
 * @jest-environment node
 */
import { GET } from '@/app/api/dashboards/[id]/datasources/route';
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

// Mock space-access if needed (though the route doesn't seems to use it directly in the stripped code, it imports it)
jest.mock('@/lib/space-access', () => ({
    requireSpaceAccess: jest.fn().mockResolvedValue(true),
}));

describe('Reproduction /api/dashboards/[id]/datasources', () => {
  it('GET /api/dashboards/[id]/datasources should fail if tables missing', async () => {
    // Use a valid UUID to avoid invalid input syntax errors
    const validUuid = '00000000-0000-0000-0000-000000000000';
    const req = new NextRequest(new URL(`http://localhost:3000/api/dashboards/${validUuid}/datasources`));
    
    // Mock params
    const params = Promise.resolve({ id: validUuid });
    
    try {
        const response = await GET(req, { params });
        console.log('Status:', response.status);
        if (response.status !== 200) {
            const body = await response.json();
            console.log('Body:', JSON.stringify(body, null, 2));
        } else {
             const body = await response.json();
             console.log('Success Body keys:', Object.keys(body));
        }
    } catch (e: any) {
        console.error('Error:', e);
    }
  });
});
