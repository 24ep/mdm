import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dataMasking } from '@/lib/data-masking'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dataMasking.initialize()
    const rules = await dataMasking.getMaskingRules()

    return NextResponse.json(rules)
  } catch (error: any) {
    console.error('Error fetching masking rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch masking rules', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    await dataMasking.initialize()
    const ruleId = await dataMasking.createMaskingRule(body)
    const rules = await dataMasking.getMaskingRules()
    const rule = rules.find(r => r.id === ruleId)

    return NextResponse.json(rule || { id: ruleId, ...body }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating masking rule:', error)
    return NextResponse.json(
      { error: 'Failed to create masking rule', details: error.message },
      { status: 500 }
    )
  }
}

