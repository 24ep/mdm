import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET - Get multi-agent config
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

    const { chatbotId } = await params
    const config = await prisma.chatbotMultiAgentConfig.findUnique({
      where: { chatbotId },
    })

    return NextResponse.json({ config: config || null })

// POST - Create or update multi-agent config


export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\chatbots\[chatbotId]\multi-agent-config\route.ts')
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\chatbots\[chatbotId]\multi-agent-config\route.ts')

    const { chatbotId } = await params
    const body = await request.json()
    const { enabled, agents, handoffRules, coordinationStrategy, metadata } = body

    // Make agents optional for updates - allow empty array
    const agentsArray = agents && Array.isArray(agents) ? agents : []

    const config = await prisma.chatbotMultiAgentConfig.upsert({
      where: { chatbotId },
      create: {
        chatbotId,
        enabled: enabled !== undefined ? enabled : false,
        agents: agentsArray,
        handoffRules: handoffRules || {},
        coordinationStrategy: coordinationStrategy || null,
        metadata: metadata || {},
      },
      update: {
        enabled: enabled !== undefined ? enabled : undefined,
        agents: agentsArray.length > 0 ? agentsArray : undefined,
        handoffRules: handoffRules !== undefined ? handoffRules : undefined,
        coordinationStrategy: coordinationStrategy !== undefined ? coordinationStrategy : undefined,
        metadata: metadata !== undefined ? metadata : undefined,
      },
    })

    return NextResponse.json({ config })

