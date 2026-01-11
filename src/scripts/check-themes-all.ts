
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

async function checkAllThemes() {
    const themes = await prisma.theme.findMany()
    console.log(`Checking ${themes.length} themes...`)

    for (const theme of themes) {
        const config = theme.config as any
        const width = config.drawerStyle?.width
        // Check main menu padding (assumed key 'platform-sidebar-menu-normal')
        const padding = config.componentStyling?.['platform-sidebar-menu-normal']?.padding

        console.log(`Theme: ${theme.name}`)
        console.log(`  Drawer Width: ${width}`)
        console.log(`  Menu Padding: ${padding}`)

        if (width && !width.includes('min(')) {
            console.warn(`  WARNING: Width might be fixed!`)
        }
        if (padding && padding !== '0.5rem') {
            console.warn(`  WARNING: Padding might be incorrect!`)
        }
    }
}

checkAllThemes()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
