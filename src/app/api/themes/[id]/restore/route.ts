import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id)
}

// POST /api/themes/[id]/restore - Restore theme to original JSON config
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        
        // Validate UUID format
        if (!isValidUUID(id)) {
            return NextResponse.json(
                { error: 'Invalid theme ID format' },
                { status: 400 }
            )
        }
        
        // Check if theme exists
        const theme = await prisma.theme.findUnique({
            where: { id }
        })

        if (!theme) {
            return NextResponse.json(
                { error: 'Theme not found' },
                { status: 404 }
            )
        }

        // Find matching JSON file in src/config/themes
        const themesDir = path.join(process.cwd(), 'src/config/themes')
        const files = fs.readdirSync(themesDir)
        let originalConfig: any = null
        let originalMetadata: any = null

        for (const file of files) {
            if (!file.endsWith('.json')) continue
            
            const filePath = path.join(themesDir, file)
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
            
            // Match by name
            if (content.name === theme.name) {
                originalMetadata = {
                    description: content.description,
                    themeMode: content.themeMode,
                    tags: content.tags || []
                }
                originalConfig = content.config
                break
            }
        }

        if (!originalConfig) {
            return NextResponse.json(
                { error: `Original configuration for theme "${theme.name}" not found in system files.` },
                { status: 404 }
            )
        }

        // Update the theme with the original config and metadata
        const updatedTheme = await prisma.theme.update({
            where: { id },
            data: {
                config: originalConfig,
                description: originalMetadata.description,
                themeMode: originalMetadata.themeMode,
                tags: originalMetadata.tags
            }
        })

        // If the theme is active, sync to system_settings
        if (updatedTheme.isActive) {
            await prisma.$executeRawUnsafe(
                `INSERT INTO system_settings (id, key, value, created_at, updated_at)
                 VALUES (gen_random_uuid(), $1, $2::jsonb, NOW(), NOW())
                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
                'branding_config',
                JSON.stringify(originalConfig)
            )
        }

        return NextResponse.json({ 
            success: true, 
            message: `Theme "${theme.name}" restored successfully.`,
            theme: updatedTheme 
        })
    } catch (error) {
        console.error('Error restoring theme:', error)
        return NextResponse.json(
            { error: 'Failed to restore theme' },
            { status: 500 }
        )
    }
}
