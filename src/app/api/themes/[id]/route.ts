import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { safeParseTheme, safeParseBrandingConfig, UpdateThemeInputSchema } from '@/lib/theme-types'

const prisma = new PrismaClient()

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id)
}

// GET /api/themes/[id] - Get single theme
export async function GET(
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
        
        const theme = await prisma.theme.findUnique({
            where: { id }
        })

        if (!theme) {
            return NextResponse.json(
                { error: 'Theme not found' },
                { status: 404 }
            )
        }

        // Validate theme before returning
        const validation = safeParseTheme(theme)
        if (!validation.success) {
            console.warn(`[GET /api/themes/${id}] Invalid theme data:`, validation.error)
            // Still return the theme but log the validation error
        }

        return NextResponse.json({ theme })
    } catch (error) {
        console.error('Error fetching theme:', error)
        return NextResponse.json(
            { error: 'Failed to fetch theme' },
            { status: 500 }
        )
    }
}

// PUT /api/themes/[id] - Update theme
export async function PUT(
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
        
        const body = await request.json()
        
        // Validate input
        const inputValidation = UpdateThemeInputSchema.safeParse(body)
        if (!inputValidation.success) {
            return NextResponse.json(
                { 
                    error: 'Invalid theme input',
                    details: inputValidation.error.issues
                },
                { status: 400 }
            )
        }

        // Check if theme exists
        const existingTheme = await prisma.theme.findUnique({
            where: { id }
        })

        if (!existingTheme) {
            return NextResponse.json(
                { error: 'Theme not found' },
                { status: 404 }
            )
        }

        // Prepare update data
        const updateData: any = {}
        if (inputValidation.data.name !== undefined) updateData.name = inputValidation.data.name
        if (inputValidation.data.description !== undefined) updateData.description = inputValidation.data.description
        if (inputValidation.data.tags !== undefined) updateData.tags = inputValidation.data.tags
        if (inputValidation.data.config !== undefined) {
            // Validate config before updating
            const configValidation = safeParseBrandingConfig(inputValidation.data.config)
            if (!configValidation.success) {
                return NextResponse.json(
                    { 
                        error: 'Invalid theme configuration',
                        details: configValidation.error.issues
                    },
                    { status: 400 }
                )
            }
            updateData.config = configValidation.data
        }

        const theme = await prisma.theme.update({
            where: { id },
            data: updateData
        })

        // If the theme is active and config was updated, sync to system_settings
        if (theme.isActive && inputValidation.data.config !== undefined) {
            await prisma.$executeRawUnsafe(
                `INSERT INTO system_settings (id, key, value, created_at, updated_at)
                 VALUES (gen_random_uuid(), $1, $2::jsonb, NOW(), NOW())
                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
                'branding_config',
                JSON.stringify(inputValidation.data.config)
            )
        }

        return NextResponse.json({ theme })
    } catch (error) {
        console.error('Error updating theme:', error)
        return NextResponse.json(
            { error: 'Failed to update theme' },
            { status: 500 }
        )
    }
}

// DELETE /api/themes/[id] - Delete theme
export async function DELETE(
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

        // Prevent deletion of default or active theme
        if (theme.isDefault) {
            return NextResponse.json(
                { error: 'Cannot delete default theme' },
                { status: 400 }
            )
        }

        if (theme.isActive) {
            return NextResponse.json(
                { error: 'Cannot delete active theme. Please activate another theme first.' },
                { status: 400 }
            )
        }

        await prisma.theme.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting theme:', error)
        return NextResponse.json(
            { error: 'Failed to delete theme' },
            { status: 500 }
        )
    }
}
