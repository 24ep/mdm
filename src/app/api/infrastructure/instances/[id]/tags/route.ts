import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get services with management plugins for this instance
    // Join with service_registry to get plugin slugs
    const result = await query(
      `SELECT DISTINCT sr.slug
       FROM instance_services is
       JOIN service_registry sr ON sr.id = is.management_plugin_id
       WHERE is.instance_id = $1
         AND is.management_plugin_id IS NOT NULL
         AND sr.slug IN ('minio-management', 'kong-management', 'grafana-management', 'prometheus-management')
         AND is.deleted_at IS NULL
         AND sr.deleted_at IS NULL`,
      [id]
    )

    // Map plugin slugs to tags
    const slugToTag: Record<string, string> = {
      'minio-management': 'minio',
      'kong-management': 'kong',
      'grafana-management': 'grafana',
      'prometheus-management': 'prometheus',
    }

    const tags = result.rows
      .map((row: any) => row.slug)
      .map((slug: string) => slugToTag[slug])
      .filter((tag): tag is string => tag !== null && tag !== undefined)

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/infrastructure/instances/${id}/tags`,
      200
    )

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ tags: [] })
  }
}

