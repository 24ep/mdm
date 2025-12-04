import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { sqlLinter } from '@/lib/sql-linter'

async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { sql, ruleIds } = await request.json()

    if (!sql || !sql.trim()) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 })
    }

    let lintResult
    if (ruleIds && Array.isArray(ruleIds)) {
      lintResult = sqlLinter.lintWithCustomRules(sql, ruleIds)
    } else {
      lintResult = sqlLinter.lint(sql)
    }

    return NextResponse.json({
      success: true,
      ...lintResult
    })
  ,
      { status: 500 }
    )
  }
}





export const POST = withErrorHandling(postHandler, 'POST POST /api/sql/lint')
export const POST = withErrorHandling(postHandler, 'POST /api/sql\lint\route.ts')
async function getHandler() {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult


    const rules = sqlLinter.getAllRules()

    return NextResponse.json({
      success: true,
      rules: rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        category: rule.category,
        severity: rule.severity,
        enabled: rule.enabled
      }))
    })
  ,
      { status: 500 }
    )
  }
}




export const GET = withErrorHandling(getHandler, 'GET GET /api/sql\lint\route.ts')