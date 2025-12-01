import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { isUuid } from '@/lib/validation'

const prisma = new PrismaClient()

// GET - List connectors
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

    const { chatbotId } = await params
    
    // Validate UUID format before querying
    if (!isUuid(chatbotId)) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    const connectors = await prisma.chatbotConnector.findMany({
      where: { chatbotId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ connectors })

// POST - Create connector


export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\chatbots\[chatbotId]\connectors\route.ts')
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\chatbots\[chatbotId]\connectors\route.ts')

    const { chatbotId } = await params
    
    // Validate UUID format before querying
    if (!isUuid(chatbotId)) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { connectorType, enabled, credentials, config, metadata } = body

    if (!connectorType) {
      return NextResponse.json(
        { error: 'connectorType is required' },
        { status: 400 }
      )
    }

    const connector = await prisma.chatbotConnector.create({
      data: {
        chatbotId,
        connectorType,
        enabled: enabled !== undefined ? enabled : true,
        credentials: credentials || null,
        config: config || {},
        metadata: metadata || {},
      },
    })

    return NextResponse.json({ connector })

