const fs = require('fs');
const path = require('path');

const files = {
    'src/app/api/chatbots/[chatbotId]/cost-export/route.ts': `import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Export cost data as CSV or JSON
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' })
  }

  const { chatbotId } = await params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json' // 'json' or 'csv'
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const where: any = {
    chatbotId,
  }

  if (startDate || endDate) {
    where.recordedAt = {}
    if (startDate) where.recordedAt.gte = new Date(startDate)
    if (endDate) where.recordedAt.lte = new Date(endDate)
  }

  const records = await prisma.chatbotCostRecord.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  if (format === 'csv') {
    // Generate CSV
    const headers = [
      'Date',
      'Cost (USD)',
      'Input Tokens',
      'Output Tokens',
      'Total Tokens',
      'Model',
      'User ID',
      'User Email',
      'User Name',
      'Thread ID',
      'Trace ID',
    ]

    const rows = records.map((record) => [
      record.recordedAt.toISOString(),
      record.cost.toString(),
      record.inputTokens?.toString() || '',
      record.outputTokens?.toString() || '',
      record.totalTokens?.toString() || '',
      record.model || '',
      record.userId || '',
      record.user?.email || '',
      record.user?.name || '',
      record.threadId || '',
      record.traceId || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => \`"\${String(cell).replace(/"/g, '""')}"\`).join(',')),
    ].join('\\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': \`attachment; filename="cost-export-\${chatbotId}-\${new Date().toISOString().split('T')[0]}.csv"\`,
      },
    })
  } else {
    // Return JSON
    return NextResponse.json({
      chatbotId,
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      records: records.map((record) => ({
        id: record.id,
        recordedAt: record.recordedAt.toISOString(),
        cost: Number(record.cost),
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        totalTokens: record.totalTokens,
        model: record.model,
        userId: record.userId,
        userEmail: record.user?.email,
        userName: record.user?.name,
        threadId: record.threadId,
        traceId: record.traceId,
        metadata: record.metadata,
      })),
    })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/cost-export')
`,
    'src/app/api/chatbots/[chatbotId]/cost-forecast/route.ts': `import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getCostForecast } from '@/lib/cost-tracker'

// GET - Get cost forecast
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' })
  }

  const { chatbotId } = await params
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  const forecast = await getCostForecast(chatbotId, days)

  return NextResponse.json({ forecast })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/cost-forecast')
`,
    'src/app/api/chatbots/[chatbotId]/cost-stats/route.ts': `import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getCostStats } from '@/lib/cost-tracker'

// GET - Get cost statistics
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' })
  }

  const { chatbotId } = await params
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const stats = await getCostStats(
    chatbotId,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  return NextResponse.json({ stats })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/cost-stats')
`,
    'src/app/api/chatbots/[chatbotId]/custom-functions/[functionId]/route.ts': `import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET - Get custom function
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' })
  }

  const { chatbotId, functionId } = await params
  const func = await prisma.chatbotCustomFunction.findUnique({
    where: { id: functionId },
  })

  if (!func || func.chatbotId !== chatbotId) {
    return NextResponse.json({ error: 'Function not found' })
  }

  return NextResponse.json({ function: func })
}

// PUT - Update custom function
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' })
  }

  const { functionId } = await params
  const body = await request.json()
  const { name, description, parameters, endpoint, code, executionType, enabled, metadata } = body

  const func = await prisma.chatbotCustomFunction.update({
    where: { id: functionId },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(parameters && { parameters }),
      ...(endpoint !== undefined && { endpoint: endpoint || null }),
      ...(code !== undefined && { code: code || null }),
      ...(executionType && { executionType }),
      ...(enabled !== undefined && { enabled }),
      ...(metadata && { metadata }),
    },
  })

  return NextResponse.json({ function: func })
}

// DELETE - Delete custom function
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' })
  }

  const { functionId } = await params
  await prisma.chatbotCustomFunction.delete({
    where: { id: functionId },
  })

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/custom-functions/[functionId]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/chatbots/[chatbotId]/custom-functions/[functionId]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/chatbots/[chatbotId]/custom-functions/[functionId]')
`,
    'src/app/api/chatbots/[chatbotId]/custom-functions/route.ts': `import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { isUuid } from '@/lib/validation'

const prisma = new PrismaClient()

// GET - List custom functions
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' })
  }

  const { chatbotId } = await params
  
  // Validate UUID format before querying
  if (!isUuid(chatbotId)) {
    return NextResponse.json(
      { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
      { status: 400 }
    )
  }
  
  const functions = await prisma.chatbotCustomFunction.findMany({
    where: { chatbotId },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ functions })
}

// POST - Create custom function
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' })
  }

  const { chatbotId } = await params
  
  // Validate UUID format before querying
  if (!isUuid(chatbotId)) {
    return NextResponse.json(
      { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
      { status: 400 }
    )
  }
  
  const body = await request.json()
  const { name, description, parameters, endpoint, code, executionType, enabled, metadata } = body

  if (!name || !description || !parameters) {
    return NextResponse.json(
      { error: 'name, description, and parameters are required' },
      { status: 400 }
    )
  }

  const func = await prisma.chatbotCustomFunction.create({
    data: {
      chatbotId,
      name,
      description,
      parameters,
      endpoint: endpoint || null,
      code: code || null,
      executionType: executionType || 'api',
      enabled: enabled !== undefined ? enabled : true,
      metadata: metadata || {},
    },
  })

  return NextResponse.json({ function: func })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/custom-functions')
export const POST = withErrorHandling(postHandler, 'POST /api/chatbots/[chatbotId]/custom-functions')
`
};

for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.resolve(process.cwd(), filePath);
    console.log(\`Fixing \${fullPath}...\`);
  fs.writeFileSync(fullPath, content);
  console.log('Done.');
}
