
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCrmMember() {
    console.log('🌱 Seeding CRM Member...')

    // 1. Find CRM Space
    const crmSpace = await prisma.space.findUnique({
        where: { slug: 'crm' }
    })

    if (!crmSpace) {
        console.error('❌ CRM Space not found! Run seed-crm-space.ts first.')
        process.exit(1)
    }

    // 2. Upsert New User
    const userEmail = 'jane.doe@example.com'
    
    // We use upsert to ensure idempotent runs
    const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
            email: userEmail,
            name: 'Jane Doe',
            password: 'placeholder_hash', // In production, hash this!
            role: 'USER',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
        }
    })
    
    console.log(`✅ User ensured: ${user.name} (${user.id})`)

    // 3. Add to Space
    try {
        await prisma.spaceMember.upsert({
            where: {
                spaceId_userId: {
                    spaceId: crmSpace.id,
                    userId: user.id
                }
            },
            update: {
                role: 'member'
            },
            create: {
                spaceId: crmSpace.id,
                userId: user.id,
                role: 'member'
            }
        })
        console.log(`✅ Added ${user.name} to CRM Space`)
    } catch (e) {
        console.log(`ℹ️ User likely already a member`)
    }

    // 4. Create a Data Record (Opportunity) for this user
    // First need the Opportunity Model ID
    const oppModel = await prisma.dataModel.findFirst({
        where: { 
            name: 'Opportunity',
            spaces: { some: { spaceId: crmSpace.id } }
        },
        include: { attributes: true }
    })

    if (oppModel) {
        // defined map of attribute name to ID
        const attrMap = oppModel.attributes.reduce((acc, curr) => {
            acc[curr.name] = curr.id
            return acc
        }, {} as Record<string, string>)
        
        // Create a record
        const record = await prisma.dataRecord.create({
            data: {
                dataModelId: oppModel.id,
                createdBy: user.id,
                values: {
                    create: [
                        { attributeId: attrMap['title'], value: 'Jane\'s First Deal' },
                        { attributeId: attrMap['value'], value: '5000' },
                        { attributeId: attrMap['stage'], value: 'Discovery' },
                         // close_date is Date type in attribute definition but value is string in DB
                        { attributeId: attrMap['close_date'], value: new Date().toISOString() } 
                    ]
                }
            }
        })
        console.log(`✅ Created Opportunity record for ${user.name}: ${record.id}`)
    } else {
        console.log('⚠️ Opportunity model not found, skipping record creation')
    }

    console.log('✅ CRM Member Seeding Complete!')
}

seedCrmMember()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
