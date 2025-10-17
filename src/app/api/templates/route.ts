import { NextRequest, NextResponse } from 'next/server'
import { TemplateManager } from '@/lib/template-manager'
import { Template } from '@/lib/template-generator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataModelId = searchParams.get('dataModelId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let templates: Template[]

    if (dataModelId) {
      templates = await TemplateManager.getTemplatesForModel(dataModelId)
    } else if (search) {
      templates = await TemplateManager.searchTemplates(search)
    } else {
      templates = await TemplateManager.getTemplates()
    }

    // Filter by category if specified
    if (category) {
      templates = templates.filter(template => template.category === category)
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const template: Template = await request.json()

    // Validate template structure
    if (!template.id || !template.name || !template.displayName) {
      return NextResponse.json(
        { success: false, error: 'Invalid template structure' },
        { status: 400 }
      )
    }

    await TemplateManager.saveTemplate(template)

    return NextResponse.json({
      success: true,
      template,
      message: 'Template saved successfully'
    })
  } catch (error) {
    console.error('Error saving template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save template' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    await TemplateManager.deleteTemplate(templateId)

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
