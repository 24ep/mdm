import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')

    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }

    // Check if user has access to this space
    const memberResult = await query(
      'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    )

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Get categories
    const categoriesResult = await query(
      `SELECT 
        fc.id,
        fc.name,
        fc.description,
        fc.color,
        fc.icon,
        fc.is_system,
        fc.created_at,
        fc.updated_at,
        u.name as created_by_name,
        COUNT(fc_rel.file_id) as file_count
       FROM file_categories fc
       LEFT JOIN users u ON fc.created_by = u.id
       LEFT JOIN file_categorizations fc_rel ON fc.id = fc_rel.category_id
       WHERE fc.space_id = $1
       GROUP BY fc.id, fc.name, fc.description, fc.color, fc.icon, fc.is_system, fc.created_at, fc.updated_at, u.name
       ORDER BY fc.is_system DESC, fc.name ASC`,
      [spaceId]
    )

    // Get tags
    const tagsResult = await query(
      `SELECT 
        ft.id,
        ft.name,
        ft.color,
        ft.created_at,
        u.name as created_by_name,
        COUNT(fta.file_id) as file_count
       FROM file_tags ft
       LEFT JOIN users u ON ft.created_by = u.id
       LEFT JOIN file_tag_assignments fta ON ft.id = fta.tag_id
       WHERE ft.space_id = $1
       GROUP BY ft.id, ft.name, ft.color, ft.created_at, u.name
       ORDER BY ft.name ASC`,
      [spaceId]
    )

    return NextResponse.json({
      categories: categoriesResult.rows,
      tags: tagsResult.rows
    })

  } catch (error) {
    console.error('Error fetching categories and tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, spaceId, name, description, color, icon } = await request.json()

    if (!spaceId || !name) {
      return NextResponse.json({ error: 'Space ID and name are required' }, { status: 400 })
    }

    // Check if user has admin access to this space
    const memberResult = await query(
      'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    )

    if (memberResult.rows.length === 0 || !['owner', 'admin'].includes(memberResult.rows[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (type === 'category') {
      // Create category
      const categoryResult = await query(
        `INSERT INTO file_categories (space_id, name, description, color, icon, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [spaceId, name, description || '', color || '#3B82F6', icon || 'folder', userId]
      )

      return NextResponse.json({
        category: categoryResult.rows[0]
      })
    } else if (type === 'tag') {
      // Create tag
      const tagResult = await query(
        `INSERT INTO file_tags (space_id, name, color, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [spaceId, name, color || '#6B7280', userId]
      )

      return NextResponse.json({
        tag: tagResult.rows[0]
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error creating category or tag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
