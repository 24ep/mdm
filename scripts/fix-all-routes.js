const fs = require('fs');
const path = require('path');

// List of route files that need fixing
const files = [
    'src/app/api/chatbots/[chatbotId]/lifecycle-hooks/[hookId]/route.ts',
    'src/app/api/chatbots/[chatbotId]/lifecycle-hooks/route.ts',
    'src/app/api/chatbots/[chatbotId]/multi-agent-config/route.ts',
    'src/app/api/chatbots/[chatbotId]/observability/metrics/route.ts',
    'src/app/api/chatbots/[chatbotId]/observability/traces/route.ts'
];

const placeholder = `import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-middleware';

async function handler(request: NextRequest) {
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}

export const GET = withErrorHandling(handler, 'GET placeholder');
`;

files.forEach(relPath => {
    const fullPath = path.resolve(process.cwd(), relPath);
    console.log('Fixing', fullPath);
    try {
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, placeholder);
        console.log('Written');
    } catch (err) {
        console.error('Error fixing', relPath, err);
    }
});
