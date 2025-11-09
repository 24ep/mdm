import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding asset management data...')

  // Seed Languages
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isDefault: true, sortOrder: 1 },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', sortOrder: 2 },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', sortOrder: 3 },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', sortOrder: 4 },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', sortOrder: 5 },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', sortOrder: 6 },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', sortOrder: 7 },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', sortOrder: 8 },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', sortOrder: 9 },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', sortOrder: 10 },
  ]

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    })
  }
  console.log(`✓ Seeded ${languages.length} languages`)

  // Seed Asset Types
  const databaseType = await prisma.assetType.upsert({
    where: { code: 'database_type' },
    update: {},
    create: {
      code: 'database_type',
      name: 'Database Types',
      description: 'Supported database systems',
      category: 'database',
      isSystem: true,
      sortOrder: 1,
    },
  })

  const systemType = await prisma.assetType.upsert({
    where: { code: 'system_type' },
    update: {},
    create: {
      code: 'system_type',
      name: 'System Types',
      description: 'External system integrations',
      category: 'system',
      isSystem: true,
      sortOrder: 2,
    },
  })

  const cmsType = await prisma.assetType.upsert({
    where: { code: 'cms_type' },
    update: {},
    create: {
      code: 'cms_type',
      name: 'CMS Types',
      description: 'Content management systems',
      category: 'cms',
      isSystem: true,
      sortOrder: 3,
    },
  })

  console.log('✓ Seeded asset types')

  // Seed Database Type Assets
  const databaseAssets = [
    {
      code: 'postgresql',
      name: 'PostgreSQL',
      description: 'Advanced open-source relational database',
      icon: '🐘',
      color: '#336791',
      metadata: { defaultPort: 5432, driver: 'pg' },
      sortOrder: 1,
      isSystem: true,
    },
    {
      code: 'mysql',
      name: 'MySQL',
      description: 'Popular open-source relational database',
      icon: '🐬',
      color: '#4479A1',
      metadata: { defaultPort: 3306, driver: 'mysql2' },
      sortOrder: 2,
      isSystem: true,
    },
    {
      code: 'sqlite',
      name: 'SQLite',
      description: 'Lightweight file-based database',
      icon: '🗄️',
      color: '#003B57',
      metadata: { driver: 'better-sqlite3' },
      sortOrder: 3,
      isSystem: true,
    },
    {
      code: 'mongodb',
      name: 'MongoDB',
      description: 'NoSQL document database',
      icon: '🍃',
      color: '#47A248',
      metadata: { defaultPort: 27017, driver: 'mongodb' },
      sortOrder: 4,
      isSystem: true,
    },
    {
      code: 'redis',
      name: 'Redis',
      description: 'In-memory data structure store',
      icon: '🔴',
      color: '#DC382D',
      metadata: { defaultPort: 6379, driver: 'redis' },
      sortOrder: 5,
      isSystem: true,
    },
    {
      code: 'clickhouse',
      name: 'ClickHouse',
      description: 'Column-oriented database management system',
      icon: '⚡',
      color: '#FFCC02',
      metadata: { defaultPort: 8123, driver: 'clickhouse' },
      sortOrder: 6,
      isSystem: true,
    },
    {
      code: 'mariadb',
      name: 'MariaDB',
      description: 'Community-developed fork of MySQL',
      icon: '🔷',
      color: '#C49A3C',
      metadata: { defaultPort: 3306, driver: 'mariadb' },
      sortOrder: 7,
      isSystem: true,
    },
    {
      code: 'mssql',
      name: 'Microsoft SQL Server',
      description: 'Microsoft relational database management system',
      icon: '💼',
      color: '#CC2927',
      metadata: { defaultPort: 1433, driver: 'mssql' },
      sortOrder: 8,
      isSystem: true,
    },
  ]

  for (const asset of databaseAssets) {
    await prisma.asset.upsert({
      where: {
        assetTypeId_code: {
          assetTypeId: databaseType.id,
          code: asset.code,
        },
      },
      update: asset,
      create: {
        ...asset,
        assetTypeId: databaseType.id,
      },
    })
  }
  console.log(`✓ Seeded ${databaseAssets.length} database type assets`)

  // Seed System Type Assets
  const systemAssets = [
    {
      code: 'api',
      name: 'REST API',
      description: 'RESTful API endpoint',
      icon: '🌐',
      color: '#4A90E2',
      sortOrder: 1,
      isSystem: true,
    },
    {
      code: 'graphql',
      name: 'GraphQL API',
      description: 'GraphQL API endpoint',
      icon: '📊',
      color: '#E10098',
      sortOrder: 2,
      isSystem: true,
    },
    {
      code: 'webhook',
      name: 'Webhook',
      description: 'Webhook integration',
      icon: '🔗',
      color: '#6B7280',
      sortOrder: 3,
      isSystem: true,
    },
    {
      code: 'sftp',
      name: 'SFTP',
      description: 'SFTP file transfer',
      icon: '📁',
      color: '#2E7D32',
      sortOrder: 4,
      isSystem: true,
    },
    {
      code: 's3',
      name: 'Amazon S3',
      description: 'Amazon S3 storage',
      icon: '☁️',
      color: '#FF9900',
      sortOrder: 5,
      isSystem: true,
    },
  ]

  for (const asset of systemAssets) {
    await prisma.asset.upsert({
      where: {
        assetTypeId_code: {
          assetTypeId: systemType.id,
          code: asset.code,
        },
      },
      update: asset,
      create: {
        ...asset,
        assetTypeId: systemType.id,
      },
    })
  }
  console.log(`✓ Seeded ${systemAssets.length} system type assets`)

  // Seed CMS Type Assets
  const cmsAssets = [
    {
      code: 'wordpress',
      name: 'WordPress',
      description: 'Popular content management system',
      icon: '📝',
      color: '#21759B',
      sortOrder: 1,
      isSystem: true,
    },
    {
      code: 'drupal',
      name: 'Drupal',
      description: 'Open-source CMS platform',
      icon: '🌿',
      color: '#0678BE',
      sortOrder: 2,
      isSystem: true,
    },
    {
      code: 'joomla',
      name: 'Joomla',
      description: 'Open-source CMS',
      icon: '🎨',
      color: '#5091CD',
      sortOrder: 3,
      isSystem: true,
    },
  ]

  for (const asset of cmsAssets) {
    await prisma.asset.upsert({
      where: {
        assetTypeId_code: {
          assetTypeId: cmsType.id,
          code: asset.code,
        },
      },
      update: asset,
      create: {
        ...asset,
        assetTypeId: cmsType.id,
      },
    })
  }
  console.log(`✓ Seeded ${cmsAssets.length} CMS type assets`)

  console.log('✓ Asset management seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding assets:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

