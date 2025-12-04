import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-middleware';

async function handler(request: NextRequest) {
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}

export const GET = withErrorHandling(handler, 'GET placeholder');
export const POST = withErrorHandling(handler, 'POST placeholder');
export const PUT = withErrorHandling(handler, 'PUT placeholder');
export const DELETE = withErrorHandling(handler, 'DELETE placeholder');
