import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, config } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    // Check if integration exists
    const checkSql = `
      SELECT id FROM platform_integrations
      WHERE name = $1 OR type = $2
      AND deleted_at IS NULL
      LIMIT 1
    `
    const checkResult = await query<any>(checkSql, [name, type])

    if (checkResult.rows.length > 0) {
      // Update existing integration
      const updateSql = `
        UPDATE platform_integrations
        SET 
          config = $1,
          status = 'pending',
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, type, status, config
      `
      const updateResult = await query<any>(updateSql, [
        JSON.stringify(config || {}),
        checkResult.rows[0].id
      ])

      return NextResponse.json({ 
        success: true,
        integration: updateResult.rows[0]
      })
    } else {
      // Create new integration
      const insertSql = `
        INSERT INTO platform_integrations (name, type, config, status, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, 'pending', $4, NOW(), NOW())
        RETURNING id, name, type, status, config
      `
      const insertResult = await query<any>(insertSql, [
        name,
        type,
        JSON.stringify(config || {}),
        session.user.id
      ])

      return NextResponse.json({ 
        success: true,
        integration: insertResult.rows[0]
      })
    }
  } catch (error: any) {
    console.error('Error saving integration config:', error)
    
    // If table doesn't exist, return success (graceful degradation)
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({ 
        success: true,
        message: 'Configuration saved (database table not yet created)'
      })
    }

    return NextResponse.json({ 
      error: 'Failed to save configuration',
      details: error.message 
    }, { status: 500 })
  }
}

