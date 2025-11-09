import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeCustomFunction } from '@/lib/custom-functions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { functionId, arguments: args, chatbotId } = body

    if (!functionId || !chatbotId) {
      return NextResponse.json(
        { error: 'functionId and chatbotId are required' },
        { status: 400 }
      )
    }

    const result = await executeCustomFunction(functionId, args, chatbotId)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error executing custom function:', error)
    return NextResponse.json(
      {
        error: 'Failed to execute custom function',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

