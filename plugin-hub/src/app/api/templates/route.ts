import { NextResponse } from 'next/server'
import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync } from 'fs'

const TEMPLATES_DIR = process.env.TEMPLATES_DIR || join(process.cwd(), 'templates')

interface Template {
    id: string
    name: string
    description?: string
    source: string
    visibility: 'private' | 'public'
    author_name?: string
    preview_image?: string
    tags?: string[]
    downloads: number
    created_at: string
    updated_at: string
}

// GET - List all templates
export async function GET() {
    try {
        const templatesPath = resolve(TEMPLATES_DIR)

        // Create directory if it doesn't exist
        if (!existsSync(templatesPath)) {
            await mkdir(templatesPath, { recursive: true })
            return NextResponse.json({ templates: [] })
        }

        const files = await readdir(templatesPath)
        const templates: Template[] = []

        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const content = await readFile(join(templatesPath, file), 'utf-8')
                    const template = JSON.parse(content)
                    // Only show public templates
                    if (template.visibility === 'public') {
                        templates.push(template)
                    }
                } catch {
                    // Skip invalid files
                }
            }
        }

        // Sort by downloads
        templates.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))

        return NextResponse.json({ templates })
    } catch (error) {
        console.error('Error listing templates:', error)
        return NextResponse.json({ templates: [] })
    }
}

// POST - Upload a new template
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, description, source, visibility, author_name, preview_image, tags } = body

        if (!name || !source) {
            return NextResponse.json(
                { error: 'Name and source are required' },
                { status: 400 }
            )
        }

        const templatesPath = resolve(TEMPLATES_DIR)

        // Create directory if it doesn't exist
        if (!existsSync(templatesPath)) {
            await mkdir(templatesPath, { recursive: true })
        }

        // Generate unique ID
        const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        const template: Template = {
            id,
            name,
            description: description || undefined,
            source,
            visibility: visibility || 'private',
            author_name: author_name || 'Anonymous',
            preview_image: preview_image || undefined,
            tags: tags || [],
            downloads: 0,
            created_at: now,
            updated_at: now,
        }

        // Save template as JSON file
        await writeFile(
            join(templatesPath, `${id}.json`),
            JSON.stringify(template, null, 2)
        )

        return NextResponse.json({ template }, { status: 201 })
    } catch (error) {
        console.error('Error creating template:', error)
        return NextResponse.json(
            { error: 'Failed to create template' },
            { status: 500 }
        )
    }
}
