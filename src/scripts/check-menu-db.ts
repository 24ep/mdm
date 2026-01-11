
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkMenuData() {
    try {
        console.log('Checking Menu Groups:')
        const groups = await prisma.menuGroup.findMany({
            include: { items: true }
        })
        console.log(JSON.stringify(groups, null, 2))

        if (groups.length === 0) {
            console.log('❌ No Menu Groups found! Seeding might be needed.')
        } else {
            console.log(`✅ Found ${groups.length} menu groups.`)
        }

    } catch (error) {
        console.error('Error querying menu data:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkMenuData()
