import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

// GET: Retrieve a specific version
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notebookId = decodeURIComponent(params.id)
    const versionId = params.versionId

    const { rows } = await query(
      `SELECT * FROM public.notebook_versions
       WHERE notebook_id = $1::uuid AND id = $2::uuid`,
      [notebookId, versionId]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    const version = rows[0]
    
    // Get creator name
    let author = 'Unknown'
    let authorEmail = ''
    if (version.created_by) {
      const { rows: userRows } = await query(
        'SELECT name, email FROM public.users WHERE id = $1::uuid',
        [version.created_by]
      )
      if (userRows.length > 0) {
        author = userRows[0].name || 'Unknown'
        authorEmail = userRows[0].email || ''
      }
    }

    return NextResponse.json({
      success: true,
      version: {
        ...version,
        notebook_data: JSON.parse(version.notebook_data),
        change_summary: version.change_summary ? JSON.parse(version.change_summary) : null,
        author,
        authorEmail
      }
    })
  } catch (error: any) {
    console.error('Error fetching notebook version:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notebook version' },
      { status: 500 }
    )
  }
}

// POST: Restore a specific version (make it current)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notebookId = decodeURIComponent(params.id)
    const versionId = params.versionId

    // Get the version to restore
    const { rows } = await query(
      `SELECT * FROM public.notebook_versions
       WHERE notebook_id = $1::uuid AND id = $2::uuid`,
      [notebookId, versionId]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    const version = rows[0]

    // Mark all versions as not current
    await query(
      'UPDATE public.notebook_versions SET is_current = false WHERE notebook_id = $1::uuid',
      [notebookId]
    )

    // Mark this version as current
    await query(
      'UPDATE public.notebook_versions SET is_current = true WHERE id = $1::uuid',
      [versionId]
    )

    return NextResponse.json({
      success: true,
      message: 'Version restored successfully',
      version: {
        ...version,
        notebook_data: JSON.parse(version.notebook_data),
        change_summary: version.change_summary ? JSON.parse(version.change_summary) : null,
        is_current: true
      }
    })
  } catch (error: any) {
    console.error('Error restoring notebook version:', error)
    return NextResponse.json(
      { error: 'Failed to restore notebook version', details: error.message },
      { status: 500 }
    )
  }
}

