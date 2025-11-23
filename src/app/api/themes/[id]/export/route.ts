import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id)
}

// GET /api/themes/[id]/export - Export theme as JSON only
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

        // Prepare export data
        const exportData = {
            theme: {
                name: theme.name,
                description: theme.description || '',
                version: '1.0.0',
                exportedAt: new Date().toISOString()
            },
            config: theme.config
        }

        // Generate filename
        const safeFileName = theme.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        const timestamp = new Date().toISOString().split('T')[0]

        // Export as JSON only
        const jsonContent = JSON.stringify(exportData, null, 2)

        return new NextResponse(jsonContent, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${safeFileName}-${timestamp}.json"`
            }
        })
    } catch (error) {
        console.error('Error exporting theme:', error)
        return NextResponse.json(
            { error: 'Failed to export theme' },
            { status: 500 }
        )
    }
}
