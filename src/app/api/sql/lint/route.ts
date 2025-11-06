import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sqlLinter } from '@/lib/sql-linter'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error: any) {
    console.error('Error linting SQL:', error)
    return NextResponse.json(
      { error: 'Failed to lint SQL', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error: any) {
    console.error('Error getting lint rules:', error)
    return NextResponse.json(
      { error: 'Failed to get lint rules', details: error.message },
      { status: 500 }
    )
  }
}

