
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()


async function debugCrmMembers() {
    console.log('🔍 Debugging CRM Members...')

    const crmSpace = await prisma.space.findUnique({
        where: { slug: 'crm' }
    })

    if (!crmSpace) {
        console.error('❌ CRM Space not found!')
        return
    }
    console.log(`CRM Space ID: ${crmSpace.id}`)

    // Check if Jane exists in User table
    const jane = await prisma.user.findUnique({
        where: { email: 'jane.doe@example.com' }
    })
    console.log('Jane User Record:', JSON.stringify(jane, null, 2))

    // Check memberships
    const members = await prisma.spaceMember.findMany({
        where: { spaceId: crmSpace.id },
        include: { user: true }
    })

    console.log(`Found ${members.length} members in CRM space:`)
    console.log(JSON.stringify(members.map(m => ({
        userName: m.user.name,
        email: m.user.email,
        spaceRole: m.role,
        isActive: m.user.isActive
    })), null, 2))
}


debugCrmMembers()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
