import fs from 'fs';
import path from 'path';

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');

function getAllRouteFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllRouteFiles(filePath, fileList);
    } else {
      if (file === 'route.ts') {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

const routeFiles = getAllRouteFiles(apiDir);
const testFileContent = `/**
 * @jest-environment node
 */
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

describe('API Endpoint Comprehensive Tests', () => {
${routeFiles.map((filePath) => {
    const relativePath = path.relative(apiDir, filePath);
    const urlPath = '/api/' + relativePath.replace(/\\/g, '/').replace('/route.ts', '');
    const isDynamic = urlPath.includes('[');
    
    // Construct params if dynamic
    const routeParams: Record<string, string> = {};
    const effectiveUrl = urlPath.replace(/\[([^\]]+)\]/g, (_, key) => {
        routeParams[key] = `dummy-${key}`;
        return `dummy-${key}`;
    });

    const importPath = filePath.replace(/\\/g, '/');

    // Return the test case string
    return `
  it('GET ${urlPath} should handle request', async () => {
    try {
        const routeModule = require('${importPath}');
        if (routeModule.GET) {
            const req = new NextRequest(new URL('${effectiveUrl}', 'http://localhost:3000'));
            const context = ${isDynamic ? JSON.stringify({ params: Promise.resolve(routeParams) }) : '{}'};
            const response = await routeModule.GET(req, context);
            
            if (response.status === 500) {
                 // console.error('500 Error in ${effectiveUrl}');
                 throw new Error('500 Error');
            }
        }
    } catch (e: any) {
        console.error('Error in ${effectiveUrl} ' + e.message);
        throw e;
    }
  });`;
}).join('\n')}
});
`;

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'test-all-endpoints.test.ts'), testFileContent);
console.log('Generated scripts/test-all-endpoints.test.ts');
