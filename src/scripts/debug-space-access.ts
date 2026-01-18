
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugSpaceAccess() {
    const spaceId = '932fa808-215e-4c45-b7f7-805ceb5cb4c2'
    console.log(`🔍 Inspecting Space ID: ${spaceId}`)

    const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: {
            creator: true
        }
    })

    if (!space) {
        console.error('❌ Space not found!')
        return
    }


    console.log(`SPACE_NAME: "${space.name}"`)
    console.log(`SPACE_SLUG: "${space.slug}"`)
}

debugSpaceAccess()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
