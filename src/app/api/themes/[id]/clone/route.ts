import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id)
}

// POST /api/themes/[id]/clone - Clone a theme
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
        
        const body = await request.json()
        const { name } = body

        // Check if source theme exists
        const sourceTheme = await prisma.theme.findUnique({
            where: { id }
        })

        if (!sourceTheme) {
            return NextResponse.json(
                { error: 'Source theme not found' },
                { status: 404 }
            )
        }

        // Validate new name
        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: 'Theme name is required' },
                { status: 400 }
            )
        }

        // Create the cloned theme
        const clonedTheme = await prisma.theme.create({
            data: {
                name: name.trim(),
                description: sourceTheme.description
                    ? `Cloned from ${sourceTheme.name}`
                    : `Copy of ${sourceTheme.name}`,
                config: sourceTheme.config as any,
                isActive: false,
                isDefault: false
            }
        })

        return NextResponse.json({ theme: clonedTheme })
    } catch (error) {
        console.error('Error cloning theme:', error)
        return NextResponse.json(
            { error: 'Failed to clone theme' },
            { status: 500 }
        )
    }
}
