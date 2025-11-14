import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'
import { categorySchema } from '@/lib/validation/report-schemas'
import { auditLogger } from '@/lib/utils/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const sql = `
      SELECT * FROM report_categories
      WHERE deleted_at IS NULL
      ORDER BY name
    `

    const result = await query(sql, [])
    return NextResponse.json(createSuccessResponse({ categories: result.rows || [] }))
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const body = await request.json()
    
    // Validate with Zod schema
    const validationResult = categorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(createErrorResponse('Validation failed', 'VALIDATION_ERROR', validationResult.error.issues), { status: 400 })
    }

    const { name, description, parent_id } = validationResult.data

    const sql = `
      INSERT INTO report_categories (name, description, parent_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `

    const result = await query(sql, [
      name,
      description || null,
      parent_id || null,
      session.user.id
    ])

    // Log audit event
    auditLogger.categoryCreated(result.rows[0].id)

    return NextResponse.json(createSuccessResponse({ category: result.rows[0] }), { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const body = await request.json()
    const { id, ...categoryData } = body

    if (!id) {
      return NextResponse.json(createErrorResponse('ID is required', 'VALIDATION_ERROR'), { status: 400 })
    }

    // Validate with Zod schema
    const validationResult = categorySchema.safeParse(categoryData)
    if (!validationResult.success) {
      return NextResponse.json(createErrorResponse('Validation failed', 'VALIDATION_ERROR', validationResult.error.issues), { status: 400 })
    }

    const { name, description, parent_id } = validationResult.data

    const sql = `
      UPDATE report_categories
      SET name = $1, description = $2, parent_id = $3, updated_at = NOW()
      WHERE id = $4 AND created_by = $5
      RETURNING *
    `

    const result = await query(sql, [
      name,
      description || null,
      parent_id || null,
      id,
      session.user.id
    ])

    if (result.rows.length === 0) {
      return NextResponse.json(createErrorResponse('Category not found', 'NOT_FOUND'), { status: 404 })
    }

    // Log audit event
    auditLogger.categoryUpdated(id)

    return NextResponse.json(createSuccessResponse({ category: result.rows[0] }))
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(createErrorResponse('ID is required', 'VALIDATION_ERROR'), { status: 400 })
    }

    const sql = `
      UPDATE report_categories
      SET deleted_at = NOW()
      WHERE id = $1 AND created_by = $2
      RETURNING *
    `

    const result = await query(sql, [id, session.user.id])

    if (result.rows.length === 0) {
      return NextResponse.json(createErrorResponse('Category not found', 'NOT_FOUND'), { status: 404 })
    }

    // Log audit event
    auditLogger.categoryDeleted(id)

    return NextResponse.json(createSuccessResponse({ deleted: true }))
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}

