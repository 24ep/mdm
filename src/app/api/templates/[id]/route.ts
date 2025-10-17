import { NextRequest, NextResponse } from 'next/server'
import { TemplateManager } from '@/lib/template-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await TemplateManager.getTemplate(params.id)

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await request.json()
    template.id = params.id // Ensure ID matches the route parameter

    await TemplateManager.saveTemplate(template)

    return NextResponse.json({
      success: true,
      template,
      message: 'Template updated successfully'
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await TemplateManager.deleteTemplate(params.id)

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
