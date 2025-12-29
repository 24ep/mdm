import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding storage connections...')

  // Check if MinIO connection already exists
  const existingMinio = await prisma.storageConnection.findFirst({
    where: {
      type: 'minio',
      name: 'Local MinIO'
    }
  })

  if (!existingMinio) {
    console.log('Creating Local MinIO connection...')
    await prisma.storageConnection.create({
      data: {
        name: 'Local MinIO',
        type: 'minio',
        description: 'Default local MinIO storage',
        isActive: true,
        status: 'connected',
        config: {
          endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
          accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
          bucket: process.env.MINIO_BUCKET || 'default',
          useSSL: process.env.MINIO_USE_SSL === 'true' || false
        }
      }
    })
    console.log('✓ Created Local MinIO connection')
  } else {
    console.log('✓ Local MinIO connection already exists')
  }
}

main()
  .catch((e) => {
    console.error('Error seeding storage connections:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
