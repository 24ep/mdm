import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id)
}

// POST /api/themes/[id]/activate - Set theme as active
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

        // Use a transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Deactivate all themes
            await tx.theme.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            })

            // Activate the selected theme
            await tx.theme.update({
                where: { id },
                data: { isActive: true }
            })

            // Sync config to system_settings using raw SQL (column is jsonb, not text)
            await tx.$executeRawUnsafe(
                `INSERT INTO system_settings (id, key, value, created_at, updated_at)
                 VALUES (gen_random_uuid(), $1, $2::jsonb, NOW(), NOW())
                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
                'branding_config',
                JSON.stringify(theme.config)
            )
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error activating theme:', error)
        return NextResponse.json(
            { error: 'Failed to activate theme' },
            { status: 500 }
        )
    }
}
