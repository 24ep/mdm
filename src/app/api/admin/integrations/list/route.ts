import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\integrations\list\route.ts')

    // Query integrations from database
    const sql = `
      SELECT 
        id,
        name,
        type,
        status,
        config,
        is_enabled as "isEnabled",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM platform_integrations
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `

    const result = await query(sql)
    
    return NextResponse.json({ 
      integrations: result.rows || [] 
    })
  } catch (error: any) {
    console.error('Error fetching integrations list:', error)
    
    // If table doesn't exist, return empty array (graceful degradation)
    if (error.message?.includes('does not exist') || error.code === '42P01' || error.meta?.code === '42P01') {
      return NextResponse.json({ integrations: [] })
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch integrations',
      details: error.message 
    }}
}

