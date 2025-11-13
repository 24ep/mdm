import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Get cost budget config
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error) {
    console.error('Error fetching cost budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST/PUT - Create or update cost budget
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error) {
    console.error('Error updating cost budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

