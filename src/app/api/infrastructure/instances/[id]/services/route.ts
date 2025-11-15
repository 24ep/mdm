import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get services for this instance
    const result = await query(
      `SELECT 
        is.*,
        json_build_object(
          'id', sr.id,
          'name', sr.name,
          'slug', sr.slug
        ) as management_plugin
      FROM instance_services is
      LEFT JOIN service_registry sr ON sr.id = is.management_plugin_id
      WHERE is.instance_id = $1
      ORDER BY is.discovered_at DESC`,
      [id]
    )

    const services = result.rows.map((row: any) => ({
      id: row.id,
      instanceId: row.instance_id,
      name: row.name,
      type: row.type,
      status: row.status,
      serviceConfig: row.service_config,
      endpoints: row.endpoints,
      healthCheckUrl: row.health_check_url,
      managementPluginId: row.management_plugin_id,
      managementConfig: row.management_config,
      managementPlugin: row.management_plugin,
      discoveredAt: row.discovered_at,
      lastSeen: row.last_seen,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/infrastructure/instances/${id}/services`,
      200
    )

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, type, serviceConfig, endpoints, healthCheckUrl } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      )
    }

    // Create service
    const result = await query(
      `INSERT INTO instance_services (
        id, instance_id, name, type, service_config, endpoints, health_check_url,
        discovered_at, last_seen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW(), NOW()
      ) RETURNING id`,
      [
        id,
        name,
        type,
        serviceConfig ? JSON.stringify(serviceConfig) : '{}',
        endpoints ? JSON.stringify(endpoints) : '[]',
        healthCheckUrl || null,
      ]
    )

    const serviceId = result.rows[0].id

    await logAPIRequest(
      session.user.id,
      'POST',
      `/api/infrastructure/instances/${id}/services`,
      201
    )

    return NextResponse.json(
      { id: serviceId, message: 'Service created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

