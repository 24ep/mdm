
/**
 * @jest-environment node
 */
import { GET as ProjectGET } from '@/app/api/projects/[id]/route';
import { GET as ReportGET } from '@/app/api/v1/reports/[id]/route';
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

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    apiRequest: jest.fn(),
    apiResponse: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock db/query to avoid DB calls
jest.mock('@/lib/db', () => ({
  db: {
    project: { findUnique: jest.fn() }
  },
  query: jest.fn()
}));

describe('Validation Tests', () => {
  it('GET /api/projects/[id] should return 400 for invalid UUID', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/projects/dummy-id'));
    const params = Promise.resolve({ id: 'dummy-id' });
    
    try {
        const response = await ProjectGET(req, { params });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe('Invalid project ID');
    } catch (e) {
        console.error(e);
        throw e;
    }
  });

  it('GET /api/v1/reports/[id] should return 400 for invalid UUID', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/v1/reports/dummy-id'));
    const params = Promise.resolve({ id: 'dummy-id' });
    
    try {
        const response = await ReportGET(req, { params });
         expect(response.status).toBe(400);
         const body = await response.json();
         // The error message might differ slightly based on implementation
         expect(body.error).toContain('Invalid report ID');
    } catch (e) {
        console.error(e);
        throw e;
    }
  });
});
