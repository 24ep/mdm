
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkSchema() {
    try {
        console.log('Checking service_registry schema:')
        const sr = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'service_registry'
    `)
        console.log(JSON.stringify(sr, null, 2))

        console.log('Checking service_installations schema:')
        const si = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'service_installations'
    `)
        console.log(JSON.stringify(si, null, 2))
    } catch (err) {
        console.error(err)
    } finally {
        await prisma.$disconnect()
    }
}

checkSchema()
