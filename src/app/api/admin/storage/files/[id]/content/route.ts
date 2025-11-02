import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const fileId = params.id

    const file = await db.spaceAttachmentStorage.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // For now, return a placeholder content
    // In production, you would fetch the actual file from storage (MinIO, S3, etc.)
    // This is a simplified version
    
    // Check if file is text-based
    const textMimeTypes = [
      'text/', 'application/json', 'application/xml', 'application/javascript',
      'application/x-javascript', 'application/typescript', 'application/x-typescript',
      'application/csv', 'text/csv'
    ]
    
    const isTextFile = textMimeTypes.some(type => file.mimeType?.startsWith(type)) ||
                      file.fileName?.match(/\.(txt|md|json|xml|js|ts|jsx|tsx|py|java|cpp|c|cs|php|rb|go|rs|swift|kt|scala|r|sh|bash|sql|html|css|yaml|yml|csv)$/i)

    if (!isTextFile) {
      return NextResponse.json({ 
        error: 'File content cannot be displayed as text',
        content: null 
      })
    }

    // TODO: Fetch actual file content from storage service
    // For now, return a placeholder
    const placeholderContent = `File: ${file.fileName}\nType: ${file.mimeType}\nSize: ${file.fileSize} bytes\n\n[File content would be loaded from storage service]`

    return NextResponse.json({
      content: placeholderContent,
      mimeType: file.mimeType,
      fileName: file.fileName
    })
  } catch (error: any) {
    console.error('Error fetching file content:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

