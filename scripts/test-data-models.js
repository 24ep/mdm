const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDataModels() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if data_models table exists and has data
    const dataModelCount = await prisma.dataModel.count()
    console.log(`📊 Total data models: ${dataModelCount}`)
    
    if (dataModelCount > 0) {
      const sampleDataModels = await prisma.dataModel.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true
        }
      })
      console.log('📋 Sample data models:', JSON.stringify(sampleDataModels, null, 2))
    }
    
    // Check data_model_spaces table
    const dataModelSpaceCount = await prisma.dataModelSpace.count()
    console.log(`🔗 Total data model spaces: ${dataModelSpaceCount}`)
    
    if (dataModelSpaceCount > 0) {
      const sampleDataModelSpaces = await prisma.dataModelSpace.findMany({
        take: 3,
        include: {
          space: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      })
      console.log('🔗 Sample data model spaces:', JSON.stringify(sampleDataModelSpaces, null, 2))
    }
    
    // Check spaces table
    const spaceCount = await prisma.space.count()
    console.log(`🏢 Total spaces: ${spaceCount}`)
    
    if (spaceCount > 0) {
      const sampleSpaces = await prisma.space.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          slug: true,
          isDefault: true
        }
      })
      console.log('🏢 Sample spaces:', JSON.stringify(sampleSpaces, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testDataModels()
