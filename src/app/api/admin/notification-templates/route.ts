import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuth('ADMIN')
  if (!authResult.success) return authResult.response
  
  const templates = await prisma.notificationTemplate.findMany({
    orderBy: { name: 'asc' }
  })
  
  return NextResponse.json(templates)
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/notification-templates')
