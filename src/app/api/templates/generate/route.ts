import { NextRequest, NextResponse } from 'next/server'
import { TemplateManager } from '@/lib/template-manager'
import { TemplateGenerator } from '@/lib/template-generator'
import { DataModel } from '@/lib/template-generator'

export async function POST(request: NextRequest) {
  try {
    const { dataModel, templateType } = await request.json()

    if (!dataModel || !dataModel.id) {
      return NextResponse.json(
        { success: false, error: 'Data model is required' },
        { status: 400 }
      )
    }

    let templates: any[]

    switch (templateType) {
      case 'entity-table':
        templates = [TemplateGenerator.generateEntityTableTemplate(dataModel)]
        break
      case 'dashboard':
        templates = [TemplateGenerator.generateDashboardTemplate(dataModel)]
        break
      case 'form':
        templates = [TemplateGenerator.generateFormTemplate(dataModel)]
        break
      case 'all':
      default:
        templates = TemplateGenerator.generateDefaultTemplates(dataModel)
        break
    }

    // Save all generated templates
    for (const template of templates) {
      await TemplateManager.saveTemplate(template)
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
      message: `${templates.length} template(s) generated successfully`
    })
  } catch (error) {
    console.error('Error generating templates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate templates' },
      { status: 500 }
    )
  }
}
