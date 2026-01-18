
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSpaceMember() {
    const targetUserId = '76db3adc-5b4f-4e1c-8cd8-b035de3fd9d3'
    const targetSpaceId = '932fa808-215e-4c45-b7f7-805ceb5cb4c2'

    console.log(`🔍 Checking User ID: ${targetUserId}`)

    const user = await prisma.user.findUnique({
        where: { id: targetUserId }
    })
    
    let finalUser = user;
    if (!finalUser) {
        console.log('⚠️ User not found! Creating user with this ID...')
        finalUser = await prisma.user.create({
            data: {
                id: targetUserId,
                email: 'missing.user@example.com',
                name: 'Restored User',
                password: 'placeholder_hash',
                role: 'USER'
            }
        })
        console.log('✅ User Created.')
    } else {
        console.log(`✅ User Found: ${finalUser.name}`)
    }
    
    console.log(`Adding ${finalUser.email} to space ${targetSpaceId}...`)

    try {
        await prisma.spaceMember.upsert({
            where: {
                spaceId_userId: {
                    spaceId: targetSpaceId,
                    userId: finalUser.id
                }
            },
            update: { role: 'admin' },
            create: {
                spaceId: targetSpaceId,
                userId: finalUser.id,
                role: 'admin'
            }
        })
        console.log('✅ Success! User added/updated in space.')
    } catch (error) {
        console.error('❌ Error adding member:', error)
    }
}

fixSpaceMember()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
