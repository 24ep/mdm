import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET - Get cost budget config
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
    const budget = await prisma.chatbotCostBudget.findUnique({
      where: { chatbotId },
    })

    if (!budget) {
      return NextResponse.json({ budget: null })
    }

    return NextResponse.json({
      budget: {
        ...budget,
        monthlyBudget: budget.monthlyBudget ? Number(budget.monthlyBudget) : null,
        dailyBudget: budget.dailyBudget ? Number(budget.dailyBudget) : null,
      },
    })

// POST/PUT - Create or update cost budget


export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\chatbots\[chatbotId]\cost-budget\route.ts')
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\chatbots\[chatbotId]\cost-budget\route.ts')

    const { chatbotId } = await params
    const body = await request.json()
    const {
      enabled,
      monthlyBudget,
      dailyBudget,
      alertThreshold,
      alertEmail,
      trackPerUser,
      trackPerThread,
    } = body

    const budget = await prisma.chatbotCostBudget.upsert({
      where: { chatbotId },
      create: {
        chatbotId,
        enabled: enabled ?? true,
        monthlyBudget: monthlyBudget ? monthlyBudget : null,
        dailyBudget: dailyBudget ? dailyBudget : null,
        alertThreshold: alertThreshold ?? 0.8,
        alertEmail,
        trackPerUser: trackPerUser ?? false,
        trackPerThread: trackPerThread ?? false,
      },
      update: {
        enabled: enabled ?? true,
        monthlyBudget: monthlyBudget ? monthlyBudget : null,
        dailyBudget: dailyBudget ? dailyBudget : null,
        alertThreshold,
        alertEmail,
        trackPerUser,
        trackPerThread,
      },
    })

    return NextResponse.json({
      budget: {
        ...budget,
        monthlyBudget: budget.monthlyBudget ? Number(budget.monthlyBudget) : null,
        dailyBudget: budget.dailyBudget ? Number(budget.dailyBudget) : null,
      },
    })

