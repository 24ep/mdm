/**
 * Seed script for default themes
 * Run with: npx ts-node src/scripts/seed-themes.ts
 * Or via npm script: npm run seed:themes
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Theme configurations directory
const THEMES_DIR = path.join(__dirname, '../config/themes')

interface ThemeConfig {
    name: string
    description: string
    themeMode: 'light' | 'dark'
    tags: string[]
    config: Record<string, any>
}

async function loadThemeConfigs(): Promise<ThemeConfig[]> {
    const themes: ThemeConfig[] = []

    if (!fs.existsSync(THEMES_DIR)) {
        console.log(`Themes directory not found: ${THEMES_DIR}`)
        return themes
    }

    const files = fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.json'))

    for (const file of files) {
        const filePath = path.join(THEMES_DIR, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const themeData = JSON.parse(content) as ThemeConfig
        themes.push(themeData)
        console.log(`Loaded theme config: ${themeData.name}`)
    }

    return themes
}

async function seedThemes() {
    console.log('Starting theme seed...')

    const themeConfigs = await loadThemeConfigs()

    for (const themeConfig of themeConfigs) {
        // Check if theme already exists by name
        const existingTheme = await prisma.theme.findFirst({
            where: { name: themeConfig.name }
        })

        if (existingTheme) {
            console.log(`Theme "${themeConfig.name}" already exists, updating...`)
            await prisma.theme.update({
                where: { id: existingTheme.id },
                data: {
                    description: themeConfig.description,
                    themeMode: themeConfig.themeMode,
                    tags: themeConfig.tags,
                    config: themeConfig.config,
                    updatedAt: new Date()
                }
            })
            console.log(`Updated theme: ${themeConfig.name}`)
        } else {
            console.log(`Creating new theme: ${themeConfig.name}`)
            await prisma.theme.create({
                data: {
                    name: themeConfig.name,
                    description: themeConfig.description,
                    themeMode: themeConfig.themeMode,
                    tags: themeConfig.tags,
                    config: themeConfig.config,
                    isActive: false,
                    isDefault: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            })
            console.log(`Created theme: ${themeConfig.name}`)
        }
    }

    console.log('\nTheme seed completed!')

    // List all themes
    const allThemes = await prisma.theme.findMany({
        select: { id: true, name: true, themeMode: true, isActive: true, isDefault: true }
    })
    console.log('\nAll themes in database:')
    console.table(allThemes)
}

// Run the seed
seedThemes()
    .catch((error) => {
        console.error('Error seeding themes:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
