
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCrmSpace() {
    console.log('🌱 Seeding CRM Space...')

    // 1. Find or Create Admin User (for createdBy fields)
    let adminUser = await prisma.user.findFirst({
        where: { email: 'admin@example.com' }
    })

    if (!adminUser) {
        console.log('Admin user not found, creating placeholder admin...')
        // Create a basic admin user if not exists (in real scenario, this should be handled by another seed)
        adminUser = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                name: 'Admin User',
                password: 'placeholder_password_hash', // In reality, use a hashed password
                role: 'ADMIN'
            }
        })
    }
    
    const userId = adminUser.id

    // 2. Upsert CRM Space
    const crmSpace = await prisma.space.upsert({
        where: { slug: 'crm' },
        update: {
            name: 'CRM Workspace',
            icon: 'Users', // Using Users icon for CRM
            description: 'Customer Relationship Management Space',
            isActive: true
        },
        create: {
            name: 'CRM Workspace',
            slug: 'crm',
            icon: 'Users',
            description: 'Customer Relationship Management Space',
            createdBy: userId,
            isActive: true
        }
    })
    
    console.log(`✅ CRM Space ensured: ${crmSpace.id}`)

    // 3. Upsert Data Models
    
    // Customer Model
    let custModel = await prisma.dataModel.findFirst({
        where: { 
            name: 'Customer', 
            spaces: { some: { spaceId: crmSpace.id } }
        }
    })
    
    if (!custModel) {
        custModel = await prisma.dataModel.create({
            data: {
                name: 'Customer',
                description: 'Companies and Contacts',
                createdBy: userId,
                spaces: { create: { spaceId: crmSpace.id } },
                attributes: {
                    create: [
                        { name: 'first_name', displayName: 'First Name', type: 'TEXT', isRequired: true, order: 10 },
                        { name: 'last_name', displayName: 'Last Name', type: 'TEXT', isRequired: true, order: 20 },
                        { name: 'email', displayName: 'Email', type: 'EMAIL', isRequired: false, isUnique: true, order: 30 },
                        { name: 'company', displayName: 'Company', type: 'TEXT', order: 35 },
                        { name: 'status', displayName: 'Status', type: 'SELECT', options: ["Active", "Lead", "Lost"], order: 40 }
                    ]
                }
            }
        })
        console.log('✅ Created Customer Data Model')
    } else {
        console.log('ℹ️ Customer Data Model already exists')
    }

    // Opportunity Model
    let oppModel = await prisma.dataModel.findFirst({
        where: { name: 'Opportunity', creator: { id: userId } }
    })
    
    if (!oppModel) {
        oppModel = await prisma.dataModel.create({
            data: {
                name: 'Opportunity',
                description: 'Sales Deals',
                createdBy: userId,
                spaces: { create: { spaceId: crmSpace.id } },
                attributes: {
                    create: [
                        { name: 'title', displayName: 'Deal Title', type: 'TEXT', isRequired: true, order: 10 },
                        { name: 'value', displayName: 'Value', type: 'NUMBER', isRequired: true, order: 20 },
                        { name: 'stage', displayName: 'Stage', type: 'SELECT', options: ["New", "Discovery", "Proposal", "Won", "Lost"], order: 30 },
                        { name: 'close_date', displayName: 'Expected Close', type: 'DATE', order: 40 }
                    ]
                }
            }
        })
         console.log('✅ Created Opportunity Data Model')
    } else {
        console.log('ℹ️ Opportunity Data Model already exists')
    }

    // 4. Upsert Attachments (Mock Data in SpaceAttachmentStorage)
    const attachments = [
        { fileName: 'Q4 Sales Plan.pdf', size: 1024 * 1024 * 2, type: 'application/pdf' },
        { fileName: 'Client List 2025.csv', size: 1024 * 50, type: 'text/csv' },
        { fileName: 'Standard Contract.docx', size: 1024 * 500, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    ]

    for (const file of attachments) {
        // Check if exists
        const exists = await prisma.spaceAttachmentStorage.findFirst({
            where: { spaceId: crmSpace.id, fileName: file.fileName }
        })

        if (!exists) {
            await prisma.spaceAttachmentStorage.create({
                data: {
                    spaceId: crmSpace.id,
                    fileName: file.fileName,
                    filePath: `mock/crm/${file.fileName}`, // Mock path
                    fileSize: file.size,
                    mimeType: file.type
                }
            })
            console.log(`✅ Created Attachment: ${file.fileName}`)
        } else {
             console.log(`ℹ️ Attachment ${file.fileName} already exists`)
        }
    }
    
    console.log('✅ CRM Space Data Seeding Complete!')
}

seedCrmSpace()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
