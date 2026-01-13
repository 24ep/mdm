
import { promises as fs } from 'fs'
import path from 'path'
import { Template } from './template-generator'

const DB_PATH = path.join(process.cwd(), 'templates-db.json')

export async function getStoredTemplates(): Promise<Template[]> {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8')
        return JSON.parse(data) // Use type assertion if needed, but JSON.parse returns any
    } catch (error) {
        return []
    }
}

export async function saveStoredTemplates(templates: Template[]) {
    await fs.writeFile(DB_PATH, JSON.stringify(templates, null, 2))
}

export async function getStoredTemplate(id: string): Promise<Template | undefined> {
    const templates = await getStoredTemplates()
    return templates.find(t => t.id === id)
}

export async function deleteStoredTemplate(id: string): Promise<boolean> {
    let templates = await getStoredTemplates()
    const initialLength = templates.length
    templates = templates.filter(t => t.id !== id)

    if (templates.length !== initialLength) {
        await saveStoredTemplates(templates)
        return true
    }
    return false
}

export async function updateStoredTemplate(template: Template): Promise<void> {
    const templates = await getStoredTemplates()
    const index = templates.findIndex(t => t.id === template.id)
    if (index >= 0) {
        templates[index] = template
    } else {
        templates.push(template)
    }
    await saveStoredTemplates(templates)
}
