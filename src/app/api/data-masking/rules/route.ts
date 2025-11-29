import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { dataMasking } from '@/lib/data-masking'

async function getHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    await dataMasking.initialize()
    const rules = await dataMasking.getMaskingRules()

    return NextResponse.json(rules)
  ,
      { status: 500 }
    )
  }
}





export const GET = withErrorHandling(getHandler, 'GET GET /api/data-masking/rules')
export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\data-masking\rules\route.ts')
async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\data-masking\rules\route.ts')

    const body = await request.json()
    await dataMasking.initialize()
    const ruleId = await dataMasking.createMaskingRule(body)
    const rules = await dataMasking.getMaskingRules()
    const rule = rules.find(r => r.id === ruleId)

    return NextResponse.json(rule || { id: ruleId, ...body }, { status: 201 })
  ,
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/data-masking/rules')

