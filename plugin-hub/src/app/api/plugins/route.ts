import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/plugins
 * List all plugins in the hub
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')

    const plugins = [
      {
        id: 'postgresql-management',
        name: 'PostgreSQL Management',
        slug: 'postgresql-management',
        description: 'Advanced management interface for PostgreSQL databases, including query analysis, performance monitoring, and backup automation.',
        version: '1.2.0',
        provider: 'MDM',
        category: 'database-management',
        status: 'active',
        verified: true,
        iconUrl: '/icons/postgresql.svg'
      },
      {
        id: 'redis-management',
        name: 'Redis Cache Manager',
        slug: 'redis-management',
        description: 'Complete Redis cluster management with key browsing, memory analysis, and real-time performance metrics.',
        version: '1.0.5',
        provider: 'MDM',
        category: 'database-management',
        status: 'active',
        verified: true,
        iconUrl: '/icons/redis.svg'
      },
      {
        id: 'prometheus-management',
        name: 'Prometheus Metrics',
        slug: 'prometheus-management',
        description: 'Seamless integration with Prometheus for scraping and visualizing custom application metrics.',
        version: '2.1.0',
        provider: 'CloudNative',
        category: 'monitoring-observability',
        status: 'active',
        verified: true
      },
      {
        id: 'grafana-management',
        name: 'Grafana Dashboards',
        slug: 'grafana-management',
        description: 'Embed and manage Grafana dashboards directly within your MDM workspace.',
        version: '3.0.1',
        provider: 'Grafana Labs',
        category: 'analytics',
        status: 'active',
        verified: true
      },
      {
        id: 'kong-management',
        name: 'Kong API Gateway',
        slug: 'kong-management',
        description: 'Manage Kong services, routes, and plugins. Monitor API traffic and enforce security policies.',
        version: '1.5.0',
        provider: 'Kong Inc.',
        category: 'api-gateway',
        status: 'active',
        verified: true
      },
      {
        id: 'minio-management',
        name: 'MinIO Object Storage',
        slug: 'minio-management',
        description: 'Browser for MinIO buckets and objects. Manage policies and lifecycle rules.',
        version: '1.1.2',
        provider: 'MinIO',
        category: 'storage-management',
        status: 'active',
        verified: true
      },
      {
        id: 'power-bi',
        name: 'Power BI Embedded',
        slug: 'power-bi',
        description: 'Integrate Power BI reports and dashboards for advanced business intelligence.',
        version: '2.0.0',
        provider: 'Microsoft',
        category: 'business-intelligence',
        status: 'active',
        verified: true
      },
      {
        id: 'looker-studio',
        name: 'Looker Studio Integration',
        slug: 'looker-studio',
        description: 'Connect Looker Studio reports to your data sources managed by MDM.',
        version: '1.0.0',
        provider: 'Google',
        category: 'analytics',
        status: 'beta',
        verified: false
      },
      {
        id: 'kafka-manager',
        name: 'Kafka Stream Manager',
        slug: 'kafka-manager',
        description: 'Monitor Kafka topics, consumer groups, and broker health in real-time.',
        version: '0.9.5',
        provider: 'Apache',
        category: 'data-integration',
        status: 'beta',
        verified: false
      },
      {
        id: 'jenkins-ci',
        name: 'Jenkins CI/CD',
        slug: 'jenkins-ci',
        description: 'View build status, trigger pipelines, and manage Jenkins jobs from a central dashboard.',
        version: '1.3.4',
        provider: 'Jenkins',
        category: 'development-tools',
        status: 'active',
        verified: true
      }
    ]

    // Apply filters
    let filteredPlugins = plugins
    if (category) {
      filteredPlugins = filteredPlugins.filter(p => p.category === category)
    }
    if (status) {
      filteredPlugins = filteredPlugins.filter(p => p.status === status)
    }
    if (verified !== null) {
      const verifiedBool = verified === 'true'
      filteredPlugins = filteredPlugins.filter(p => p.verified === verifiedBool)
    }

    return NextResponse.json({ plugins: filteredPlugins })
  } catch (error) {
    console.error('Error fetching plugins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugins', plugins: [] },
      { status: 500 }
    )
  }
}
