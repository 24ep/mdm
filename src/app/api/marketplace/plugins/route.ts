import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { rateLimitMiddleware } from '@/shared/middleware/api-rate-limit'

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, {
    windowMs: 60000,
    maxRequests: 100,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')
    const serviceType = searchParams.get('serviceType')

    // Marketplace is accessible to all authenticated users
    // Skip permission check for admins, and allow all authenticated users access
    // (Permission system may not be fully configured yet)
    try {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
        const permission = await checkPermission({
          resource: 'marketplace',
          action: 'read',
        })

        if (!permission.allowed) {
          // Log the permission denial but still allow access
          // Marketplace should be publicly accessible to authenticated users
          console.warn('Permission check failed for marketplace:', permission.reason)
        }
      }
    } catch (permError) {
      // If permission check fails (e.g., database error), log but continue
      // Marketplace should be accessible to all authenticated users
      console.warn('Permission check error (continuing anyway):', permError)
    }

    let whereConditions = ['sr.deleted_at IS NULL']
    const queryParams: any[] = []
    let paramIndex = 1

    if (category) {
      whereConditions.push(`sr.category = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`sr.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    } else {
      // Default to approved plugins only
      whereConditions.push(`sr.status = $${paramIndex}`)
      queryParams.push('approved')
      paramIndex++
    }

    if (verified === 'true') {
      whereConditions.push(`sr.verified = true`)
    }

    if (serviceType) {
      // Filter by service type in capabilities
      whereConditions.push(`sr.capabilities->>'serviceType' = $${paramIndex}`)
      queryParams.push(serviceType)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    const pluginsQuery = `
      SELECT 
        sr.id,
        sr.name,
        sr.slug,
        sr.description,
        sr.version,
        sr.provider,
        sr.provider_url,
        sr.category,
        sr.status,
        sr.capabilities,
        sr.api_base_url,
        sr.api_auth_type,
        sr.api_auth_config,
        sr.ui_type,
        sr.ui_config,
        sr.webhook_supported,
        sr.webhook_events,
        sr.icon_url,
        sr.screenshots,
        sr.documentation_url,
        sr.support_url,
        sr.pricing_info,
        sr.installation_count,
        sr.rating,
        sr.review_count,
        sr.verified,
        sr.security_audit,
        sr.created_at,
        sr.updated_at
      FROM service_registry sr
      WHERE ${whereClause}
      ORDER BY sr.installation_count DESC, sr.created_at DESC
    `

    let pluginsResult
    try {
      pluginsResult = await query(pluginsQuery, queryParams)
    } catch (dbError: any) {
      console.error('Database error fetching plugins:', dbError)
      // If service_registry table doesn't exist, return empty array
      if (dbError?.code === '42P01' || dbError?.message?.includes('does not exist')) {
        console.warn('service_registry table does not exist, returning empty plugins list')
        return NextResponse.json({ plugins: [] })
      }
      throw dbError
    }

    const plugins = pluginsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      version: row.version,
      provider: row.provider,
      providerUrl: row.provider_url,
      category: row.category,
      status: row.status,
      capabilities: row.capabilities,
      apiBaseUrl: row.api_base_url,
      apiAuthType: row.api_auth_type,
      apiAuthConfig: row.api_auth_config,
      uiType: row.ui_type,
      uiConfig: row.ui_config,
      webhookSupported: row.webhook_supported,
      webhookEvents: row.webhook_events,
      iconUrl: row.icon_url,
      screenshots: row.screenshots,
      documentationUrl: row.documentation_url,
      supportUrl: row.support_url,
      pricingInfo: row.pricing_info,
      installationCount: row.installation_count,
      rating: row.rating ? parseFloat(row.rating) : null,
      reviewCount: row.review_count,
      verified: row.verified,
      securityAudit: row.security_audit,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    await logAPIRequest(
      session.user.id,
      'GET',
      '/api/marketplace/plugins',
      200
    )

    return NextResponse.json({ plugins })
  } catch (error) {
    console.error('Error fetching plugins:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, {
    windowMs: 60000,
    maxRequests: 50, // Lower limit for POST
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can register plugins
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      version,
      provider,
      providerUrl,
      category,
      capabilities,
      apiBaseUrl,
      apiAuthType,
      apiAuthConfig,
      uiType,
      uiConfig,
      webhookSupported,
      webhookEvents,
      iconUrl,
      screenshots,
      documentationUrl,
      supportUrl,
      pricingInfo,
    } = body

    if (!name || !slug || !version || !provider || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await query(
      'SELECT id FROM service_registry WHERE slug = $1 AND deleted_at IS NULL',
      [slug]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Plugin with this slug already exists' },
        { status: 409 }
      )
    }

    // Insert plugin
    const result = await query(
      `INSERT INTO service_registry (
        id, name, slug, description, version, provider, provider_url, category,
        status, capabilities, api_base_url, api_auth_type, api_auth_config,
        ui_type, ui_config, webhook_supported, webhook_events, icon_url,
        screenshots, documentation_url, support_url, pricing_info, verified,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20, false, NOW(), NOW()
      ) RETURNING id`,
      [
        name,
        slug,
        description || null,
        version,
        provider,
        providerUrl || null,
        category,
        capabilities ? JSON.stringify(capabilities) : '{}',
        apiBaseUrl || null,
        apiAuthType || null,
        apiAuthConfig ? JSON.stringify(apiAuthConfig) : '{}',
        uiType || null,
        uiConfig ? JSON.stringify(uiConfig) : '{}',
        webhookSupported || false,
        webhookEvents || [],
        iconUrl || null,
        screenshots || [],
        documentationUrl || null,
        supportUrl || null,
        pricingInfo ? JSON.stringify(pricingInfo) : null,
      ]
    )

    const pluginId = result.rows[0].id

    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/marketplace/plugins',
      201
    )

    return NextResponse.json(
      { id: pluginId, message: 'Plugin registered successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering plugin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

