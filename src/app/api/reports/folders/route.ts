import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'
import { folderSchema } from '@/lib/validation/report-schemas'
import { auditLogger } from '@/lib/utils/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const sql = `
      SELECT * FROM report_folders
      WHERE deleted_at IS NULL
      ORDER BY name
    `

    const result = await query<any>(sql, [])
    return NextResponse.json(createSuccessResponse({ folders: result.rows || [] }))
  } catch (error) {
    console.error('Error fetching folders:', error)
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
    const validationResult = folderSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(createErrorResponse('Validation failed', 'VALIDATION_ERROR', validationResult.error.errors), { status: 400 })
    }

    const { name, description, parent_id } = validationResult.data

    const sql = `
      INSERT INTO report_folders (name, description, parent_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `

    const result = await query<any>(sql, [
      name,
      description || null,
      parent_id || null,
      session.user.id
    ])

    // Log audit event
    auditLogger.folderCreated(result.rows[0].id)

    return NextResponse.json(createSuccessResponse({ folder: result.rows[0] }), { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
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
    const { id, ...folderData } = body

    if (!id) {
      return NextResponse.json(createErrorResponse('ID is required', 'VALIDATION_ERROR'), { status: 400 })
    }

    // Validate with Zod schema
    const validationResult = folderSchema.safeParse(folderData)
    if (!validationResult.success) {
      return NextResponse.json(createErrorResponse('Validation failed', 'VALIDATION_ERROR', validationResult.error.errors), { status: 400 })
    }

    const { name, description, parent_id } = validationResult.data

    const sql = `
      UPDATE report_folders
      SET name = $1, description = $2, parent_id = $3, updated_at = NOW()
      WHERE id = $4 AND created_by = $5
      RETURNING *
    `

    const result = await query<any>(sql, [
      name,
      description || null,
      parent_id || null,
      id,
      session.user.id
    ])

    if (result.rows.length === 0) {
      return NextResponse.json(createErrorResponse('Folder not found', 'NOT_FOUND'), { status: 404 })
    }

    // Log audit event
    auditLogger.folderUpdated(id)

    return NextResponse.json(createSuccessResponse({ folder: result.rows[0] }))
  } catch (error) {
    console.error('Error updating folder:', error)
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
      UPDATE report_folders
      SET deleted_at = NOW()
      WHERE id = $1 AND created_by = $2
      RETURNING *
    `

    const result = await query<any>(sql, [id, session.user.id])

    if (result.rows.length === 0) {
      return NextResponse.json(createErrorResponse('Folder not found', 'NOT_FOUND'), { status: 404 })
    }

    // Log audit event
    auditLogger.folderDeleted(id)

    return NextResponse.json(createSuccessResponse({ deleted: true }))
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}

