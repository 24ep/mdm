/**
 * Seed Marketplace Plugins
 * 
 * This script seeds the service_registry table with default marketplace plugins.
 * Run this during application startup or as a migration script.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Default marketplace plugins to seed
const defaultPlugins = [
  {
    name: 'Grafana',
    slug: 'grafana',
    version: '1.0.0',
    provider: 'Grafana Labs',
    providerUrl: 'https://grafana.com',
    category: 'monitoring-observability',
    status: 'approved',
    verified: true,
    description: 'Connect and embed Grafana dashboards. Supports API key authentication, dashboard syncing, and multiple access types.',
    capabilities: {
      source: 'local-folder',
      sourcePath: 'plugin-hub/plugins/grafana',
      dashboardEmbedding: true,
      dashboardSyncing: true,
      apiAccess: true,
      sdkAccess: true,
      publicLinkAccess: true,
    },
    apiAuthType: 'api_key',
    apiAuthConfig: {
      headerName: 'Authorization',
      headerValue: 'Bearer {api_key}',
    },
    uiType: 'react_component',
    uiConfig: {
      componentPath: 'components/GrafanaIntegrationUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    iconUrl: '/icons/grafana.svg',
    screenshots: [],
    documentationUrl: 'https://grafana.com/docs/grafana/latest/developers/http_api/',
    supportUrl: 'https://grafana.com/support',
    pricingInfo: {
      type: 'open-source',
      note: 'Grafana is open-source and free to use',
    },
  },
  {
    name: 'Power BI',
    slug: 'power-bi',
    version: '1.0.0',
    provider: 'Microsoft',
    providerUrl: 'https://powerbi.microsoft.com',
    category: 'business-intelligence',
    status: 'approved',
    verified: true,
    description: 'Embed Power BI reports and dashboards. Supports OAuth2 authentication and Power BI Service integration.',
    capabilities: {
      source: 'local-folder',
      sourcePath: 'plugin-hub/plugins/power-bi',
      dashboardEmbedding: true,
      reportEmbedding: true,
      oauthAuth: true,
    },
    apiAuthType: 'oauth2',
    uiType: 'react_component',
    uiConfig: {
       componentPath: 'components/PowerBIUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    iconUrl: '/icons/power-bi.svg',
    screenshots: [],
    documentationUrl: 'https://docs.microsoft.com/en-us/power-bi/',
    supportUrl: 'https://powerbi.microsoft.com/support/',
    pricingInfo: {
      type: 'subscription',
      note: 'Requires Power BI Pro or Premium license',
    },
  },
  {
    name: 'Looker Studio',
    slug: 'looker-studio',
    version: '1.0.0',
    provider: 'Google',
    providerUrl: 'https://lookerstudio.google.com',
    category: 'business-intelligence',
    status: 'approved',
    verified: true,
    description: 'Embed Looker Studio (formerly Google Data Studio) reports. Supports public and authenticated embedding.',
    capabilities: {
      source: 'local-folder',
      sourcePath: 'plugin-hub/plugins/looker-studio',
      reportEmbedding: true,
      publicLinkAccess: true,
    },
    apiAuthType: 'oauth2',
    uiType: 'react_component',
    uiConfig: {
       componentPath: 'components/LookerStudioUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    iconUrl: '/icons/looker-studio.svg',
    screenshots: [],
    documentationUrl: 'https://developers.google.com/looker-studio',
    supportUrl: 'https://support.google.com/looker-studio',
    pricingInfo: {
      type: 'free',
      note: 'Looker Studio is free to use',
    },
  },
  {
    name: 'MinIO Management',
    slug: 'minio-management',
    version: '1.0.0',
    provider: 'MDM Platform',
    category: 'storage-management',
    status: 'approved',
    verified: true,
    description: 'Manage MinIO object storage instances. Create buckets, upload files, and manage access policies.',
    capabilities: {
      source: 'local-folder',
      sourcePath: 'plugin-hub/plugins/minio-management',
      serviceType: 'docker_container',
      supportedServices: ['minio'],
    },
    uiType: 'react_component',
    uiConfig: {
      componentPath: 'components/MinIOManagementUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    iconUrl: '/icons/minio.svg',
    screenshots: [],
  },
  {
    name: 'Prometheus Management',
    slug: 'prometheus-management',
    version: '1.0.0',
    provider: 'MDM Platform',
    category: 'monitoring-observability',
    status: 'approved',
    verified: true,
    description: 'Manage Prometheus monitoring instances. View metrics, configure alerts, and manage targets.',
    capabilities: {
      source: 'local-folder',
      sourcePath: 'plugin-hub/plugins/prometheus-management',
      serviceType: 'docker_container',
      supportedServices: ['prometheus'],
    },
    uiType: 'react_component',
    uiConfig: {
      componentPath: 'components/PrometheusManagementUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    iconUrl: '/icons/prometheus.svg',
    screenshots: [],
  },
  {
    name: 'Redis Management',
    slug: 'redis-management',
    version: '1.0.0',
    provider: 'MDM Platform',
    category: 'database-management',
    status: 'approved',
    verified: true,
    description: 'Manage Redis cache instances. Monitor keys, execute commands, and view statistics.',
    capabilities: {
      source: 'local-folder',
      sourcePath: 'plugin-hub/plugins/redis-management',
      serviceType: 'docker_container',
      supportedServices: ['redis'],
    },
    uiType: 'react_component',
    uiConfig: {
      componentPath: 'components/RedisManagementUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    iconUrl: '/icons/redis.svg',
    screenshots: [],
  },
  {
    name: 'PostgreSQL Management',
    slug: 'postgresql-management',
    version: '1.0.0',
    provider: 'MDM Platform',
    category: 'database-management',
    status: 'approved',
    verified: true,
    description: 'Manage PostgreSQL database instances. Run queries, view schemas, and monitor performance.',
    capabilities: {
      source: 'local-folder',
      sourcePath: 'plugin-hub/plugins/postgresql-management',
      serviceType: 'docker_container',
      supportedServices: ['postgresql', 'postgres'],
    },
    uiType: 'react_component',
    uiConfig: {
      componentPath: 'components/PostgreSQLManagementUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    iconUrl: '/icons/postgresql.svg',
    screenshots: [],
  },
  {
    name: 'Kong API Gateway Management',
    slug: 'kong-management',
    version: '1.0.0',
    provider: 'MDM Platform',
    category: 'api-management',
    status: 'approved',
    verified: true,
    description: 'Manage Kong API Gateway instances. Configure routes, services, plugins, and consumers.',
    capabilities: {
      source: 'local-folder',
      sourcePath: 'plugin-hub/plugins/kong-management',
      serviceType: 'docker_container',
      supportedServices: ['kong'],
    },
    uiType: 'react_component',
    uiConfig: {
      componentPath: 'components/KongManagementUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    iconUrl: '/icons/kong.svg',
    screenshots: [],
  },
  {
    name: 'Grafana Management',
    slug: 'grafana-management',
    version: '1.0.0',
    provider: 'MDM Platform',
    category: 'monitoring-observability',
    status: 'approved',
    verified: true,
    description: 'Manage Grafana instances. Configure dashboards, data sources, and alerts.',
    capabilities: {
      source: 'local-folder',
      sourcePath: 'plugin-hub/plugins/grafana-management',
      serviceType: 'docker_container',
      supportedServices: ['grafana'],
    },
    uiType: 'react_component',
    uiConfig: {
      componentPath: 'components/GrafanaManagementUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    screenshots: [],
  },
  {
    name: 'SQL Query Editor',
    slug: 'sql-query', // Folder is sql-query, slug was sql-query-editor, changing to match folder for consistency
    version: '1.0.0',
    provider: 'MDM Platform',
    category: 'database-management',
    status: 'approved',
    verified: true,
    description: 'Advanced SQL query editor with syntax highlighting, auto-complete, query history, and result visualization.',
    capabilities: {
       source: 'local-folder',
       sourcePath: 'plugin-hub/plugins/sql-query',
       queryExecution: true,
       syntaxHighlighting: true,
       autoComplete: true,
       resultExport: true,
    },
    uiType: 'react_component',
    uiConfig: {
      // Assuming component is standard named
      componentPath: 'components/SQLQueryEditorUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    iconUrl: '/icons/sql.svg',
    screenshots: [],
  },
  {
    name: 'Knowledge Base Manager',
    slug: 'knowledge-base',
    version: '1.0.0',
    provider: 'MDM Platform',
    category: 'ai-ml',
    status: 'approved',
    verified: true,
    description: 'Create and manage vector-based knowledge bases for AI chatbots. Supports document ingestion, embedding, and semantic search.',
    capabilities: {
      source: 'local-folder',
      sourcePath: 'plugin-hub/plugins/knowledge-base',
      documentIngestion: true,
      vectorEmbedding: true,
      semanticSearch: true,
      chatbotIntegration: true,
    },
    uiType: 'react_component',
    uiConfig: {
      componentPath: 'src/components/KnowledgeBaseUI',
    },
    webhookSupported: false,
    webhookEvents: [],
    iconUrl: '/icons/knowledge-base.svg',
    screenshots: [],
  }
];

async function seedPlugins() {
  console.log('🔌 Seeding marketplace plugins...');

  let updated = 0;
  let inserted = 0;

  for (const plugin of defaultPlugins) {
    try {
      // Check if plugin already exists
      const existing = await prisma.$queryRawUnsafe(
        'SELECT id FROM service_registry WHERE slug = $1 AND deleted_at IS NULL',
        plugin.slug
      );

      if (Array.isArray(existing) && existing.length > 0) {
        // UPDATE existing plugin
        const id = existing[0].id;
        await prisma.$executeRawUnsafe(
          `UPDATE service_registry SET
            name = $2, description = $3, version = $4, provider = $5, provider_url = $6, category = $7,
            status = $8, capabilities = $9::jsonb, api_base_url = $10, api_auth_type = $11, api_auth_config = $12::jsonb,
            ui_type = $13, ui_config = $14::jsonb, webhook_supported = $15, webhook_events = $16, icon_url = $17,
            screenshots = $18, documentation_url = $19, support_url = $20, pricing_info = $21::jsonb, verified = $22,
            updated_at = NOW()
          WHERE id = $1`,
          id,
          plugin.name,
          plugin.description || null,
          plugin.version,
          plugin.provider,
          plugin.providerUrl || null,
          plugin.category || null,
          plugin.status || 'approved',
          JSON.stringify(plugin.capabilities || {}),
          plugin.apiBaseUrl || null,
          plugin.apiAuthType || null,
          JSON.stringify(plugin.apiAuthConfig || {}),
          plugin.uiType || null,
          JSON.stringify(plugin.uiConfig || {}),
          plugin.webhookSupported || false,
          plugin.webhookEvents || [],
          plugin.iconUrl || null,
          plugin.screenshots || [],
          plugin.documentationUrl || null,
          plugin.supportUrl || null,
          plugin.pricingInfo ? JSON.stringify(plugin.pricingInfo) : null,
          plugin.verified || false
        );
        console.log(`  🔄 Updated plugin: ${plugin.name} (${plugin.slug})`);
        updated++;
      } else {
        // INSERT new plugin
        await prisma.$executeRawUnsafe(
          `INSERT INTO service_registry (
            id, name, slug, description, version, provider, provider_url, category,
            status, capabilities, api_base_url, api_auth_type, api_auth_config,
            ui_type, ui_config, webhook_supported, webhook_events, icon_url,
            screenshots, documentation_url, support_url, pricing_info, verified,
            installation_count, rating, review_count, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12::jsonb,
            $13, $14::jsonb, $15, $16, $17, $18, $19, $20, $21::jsonb, $22,
            0, NULL, 0, NOW(), NOW()
          )`,
          plugin.name,
          plugin.slug,
          plugin.description || null,
          plugin.version,
          plugin.provider,
          plugin.providerUrl || null,
          plugin.category || null,
          plugin.status || 'approved',
          JSON.stringify(plugin.capabilities || {}),
          plugin.apiBaseUrl || null,
          plugin.apiAuthType || null,
          JSON.stringify(plugin.apiAuthConfig || {}),
          plugin.uiType || null,
          JSON.stringify(plugin.uiConfig || {}),
          plugin.webhookSupported || false,
          plugin.webhookEvents || [],
          plugin.iconUrl || null,
          plugin.screenshots || [],
          plugin.documentationUrl || null,
          plugin.supportUrl || null,
          plugin.pricingInfo ? JSON.stringify(plugin.pricingInfo) : null,
          plugin.verified || false
        );
        console.log(`  ✅ Seeded plugin: ${plugin.name} (${plugin.slug})`);
        inserted++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to seed plugin ${plugin.slug}:`, error.message);
      // Continue with other plugins
    }
  }

  console.log(`\n🔌 Plugin seeding complete: ${inserted} inserted, ${updated} updated`);
}

async function run() {
  try {
    await seedPlugins();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding plugins:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

run();
