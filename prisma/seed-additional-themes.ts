import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function seedAdditionalThemes() {
    console.log('🔎 Scanning theme files for new entries...')
    const themesDir = path.join(process.cwd(), 'src', 'config', 'themes')
    const files = fs.readdirSync(themesDir).filter(f => f.endsWith('.json'))

    for (const file of files) {
        const filePath = path.join(themesDir, file)
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        const existing = await prisma.theme.findFirst({ where: { name: data.name } })
        if (existing) {
            console.log(`⚠️ Theme "${data.name}" already exists, skipping.`)
            continue
        }
        await prisma.theme.create({
            data: {
                name: data.name,
                description: data.description || '',
                themeMode: data.themeMode || 'light',
                tags: data.tags || [], // Use tags directly from JSON file, or empty array
                config: data.config,
                isDefault: file === 'default.json' || file === 'default-dark.json',
                isActive: false
            }
        })
        console.log(`✅ Inserted new theme: ${data.name}`)
    }
    console.log('🎉 All new themes processed.')
    await prisma.$disconnect()
}

if (require.main === module) {
    seedAdditionalThemes()
        .catch(err => {
            console.error('Error seeding additional themes:', err)
            process.exit(1)
        })
}
