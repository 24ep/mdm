import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import yaml from 'js-yaml'
import { safeParseBrandingConfig, ImportThemeInputSchema } from '@/lib/theme-types'

const prisma = new PrismaClient()

// POST /api/themes/import - Import theme from JSON or YAML
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Read file content
        const fileContent = await file.text()
        const fileName = file.name.toLowerCase()

        let parsedData: any

        try {
            // Determine format and parse
            if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
                parsedData = yaml.load(fileContent)
            } else if (fileName.endsWith('.json')) {
                parsedData = JSON.parse(fileContent)
            } else {
                return NextResponse.json(
                    { error: 'Unsupported file format. Use .json or .yaml/.yml' },
                    { status: 400 }
                )
            }
        } catch (parseError) {
            console.error('Error parsing file:', parseError)
            return NextResponse.json(
                { error: 'Invalid file format. Could not parse file content.' },
                { status: 400 }
            )
        }

        // Validate structure using Zod
        if (!parsedData.config) {
            return NextResponse.json(
                { error: 'Invalid theme file. Missing "config" property.' },
                { status: 400 }
            )
        }

        // Validate config with Zod schema
        const configValidation = safeParseBrandingConfig(parsedData.config)
        if (!configValidation.success) {
            return NextResponse.json(
                { 
                    error: 'Invalid theme configuration',
                    details: configValidation.error.errors
                },
                { status: 400 }
            )
        }

        // Extract theme name (use from file or generate)
        let themeName = parsedData.theme?.name || 'Imported Theme'

        // Check if theme name already exists and make it unique
        const existingTheme = await prisma.theme.findFirst({
            where: { name: themeName }
        })

        if (existingTheme) {
            const timestamp = new Date().getTime()
            themeName = `${themeName} (${timestamp})`
        }

        // Create the theme with validated config
        const theme = await prisma.theme.create({
            data: {
                name: themeName,
                description: parsedData.theme?.description || parsedData.description || 'Imported theme',
                themeMode: parsedData.themeMode || parsedData.theme?.themeMode || 'light', // Default to 'light' if not specified
                config: configValidation.data, // Use validated config
                isActive: false,
                isDefault: false
            }
        })

        return NextResponse.json(
            {
                theme,
                message: 'Theme imported successfully'
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error importing theme:', error)
        return NextResponse.json(
            { error: 'Failed to import theme' },
            { status: 500 }
        )
    }
}
