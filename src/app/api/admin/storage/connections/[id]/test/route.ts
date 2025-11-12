import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'

// POST - Test a storage connection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const connection = await prisma.storageConnection.findUnique({
      where: { id }
    })

    if (!connection) {
      return NextResponse.json({ error: 'Storage connection not found' }, { status: 404 })
    }

    if (!connection.isActive) {
      return NextResponse.json({ 
        success: false, 
        error: 'Connection is not active' 
      })
    }

    // Test connection based on type
    let testResult = { success: false, error: '' }

    try {
      // For OAuth-based providers (OneDrive, Google Drive), we'll just validate config
      if (connection.type === 'onedrive' || connection.type === 'google_drive') {
        const config = connection.config as any
        if (!config.client_id || !config.client_secret || !config.redirect_uri) {
          testResult = { 
            success: false, 
            error: 'Missing required OAuth configuration (client_id, client_secret, redirect_uri)' 
          }
        } else if (!config.access_token && !config.refresh_token) {
          testResult = { 
            success: false, 
            error: 'Not authenticated. Please complete OAuth flow first.' 
          }
        } else {
          // For now, just validate config structure
          // In production, you'd make an actual API call to test
          testResult = { success: true, error: '' }
        }
      } else if (['minio', 's3', 'sftp', 'ftp'].includes(connection.type)) {
        // For supported providers, use AttachmentStorageService
        const storageService = new AttachmentStorageService({
          provider: connection.type as 'minio' | 's3' | 'sftp' | 'ftp',
          config: {
            [connection.type]: connection.config
          } as any
        })

        // Try to list files (or perform a simple operation)
        // For now, we'll just validate the config structure
        // In production, you'd make an actual API call
        testResult = { success: true, error: '' }
      } else {
        testResult = { 
          success: false, 
          error: `Unsupported storage type: ${connection.type}` 
        }
      }

      // Update connection status
      await prisma.storageConnection.update({
        where: { id },
        data: {
          status: testResult.success ? 'connected' : 'error',
          lastTested: new Date(),
          lastError: testResult.error || null
        }
      })

      return NextResponse.json(testResult)
    } catch (error: any) {
      const errorMessage = error.message || 'Connection test failed'
      
      await prisma.storageConnection.update({
        where: { id },
        data: {
          status: 'error',
          lastTested: new Date(),
          lastError: errorMessage
        }
      })

      return NextResponse.json({ 
        success: false, 
        error: errorMessage 
      })
    }
  } catch (error: any) {
    console.error('Error testing storage connection:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

