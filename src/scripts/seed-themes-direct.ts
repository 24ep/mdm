
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function seedThemes() {
    console.log('Starting direct theme seed...')

    const themesDir = path.join(__dirname, '../config/themes')

    try {
        const files = fs.readdirSync(themesDir).filter(file => file.endsWith('.json'))

        for (const file of files) {
            console.log(`Processing ${file}...`)
            const filePath = path.join(themesDir, file)
            const content = fs.readFileSync(filePath, 'utf-8')
            const themeConfig = JSON.parse(content)

            try {
                // Use findFirst since name might not be @unique
                const existing = await prisma.theme.findFirst({
                    where: { name: themeConfig.name }
                })

                if (existing) {
                    console.log(`Updating theme: ${themeConfig.name}`)
                    await prisma.theme.update({
                        where: { id: existing.id },
                        data: {
                            config: themeConfig.config,
                            isActive: true, // Ensure it's active
                            updatedAt: new Date()
                        }
                    })
                } else {
                    console.log(`Creating theme: ${themeConfig.name}`)
                    await prisma.theme.create({
                        data: {
                            name: themeConfig.name,
                            config: themeConfig.config,
                            isActive: true,
                            // removed isSystem which caused lint error
                            themeMode: 'light', // Default fallback
                            description: themeConfig.description || '',
                            tags: themeConfig.tags || [],
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    })
                }
            } catch (err) {
                console.error(`Error processing theme ${file}:`, err)
            }
        }

        console.log('Theme seeding completed successfully.')
    } catch (error) {
        console.error('Fatal error seeding themes:', error)
    } finally {
        await prisma.$disconnect()
    }
}

seedThemes()
