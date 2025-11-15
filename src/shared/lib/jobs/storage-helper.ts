import { AttachmentStorageService } from '@/lib/attachment-storage'
import { query } from '@/lib/db'

/**
 * Get storage service for import/export jobs
 */
export async function getStorageService(): Promise<AttachmentStorageService | null> {
  try {
    // Get active storage connection from database
    // Try storage_connections table first, fallback to environment variables
    let storageResult
    try {
      storageResult = await query(
        `SELECT type, config FROM storage_connections 
         WHERE is_active = true 
         AND type IN ('minio', 's3')
         LIMIT 1`
      )
    } catch (error) {
      // Table might not exist, use environment variables
      storageResult = { rows: [] }
    }

    if (storageResult.rows.length === 0) {
      // Try environment variables as fallback
      if (process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY) {
        return new AttachmentStorageService({
          provider: 'minio',
          config: {
            minio: {
              endpoint: process.env.MINIO_ENDPOINT,
              access_key: process.env.MINIO_ACCESS_KEY,
              secret_key: process.env.MINIO_SECRET_KEY || '',
              bucket: process.env.MINIO_BUCKET || 'import-export',
              region: process.env.MINIO_REGION || 'us-east-1',
              use_ssl: process.env.MINIO_USE_SSL === 'true',
            },
            s3: {
              access_key_id: '',
              secret_access_key: '',
              bucket: '',
              region: '',
            },
            sftp: {
              host: '',
              port: 22,
              username: '',
              password: '',
              path: '',
            },
            ftp: {
              host: '',
              port: 21,
              username: '',
              password: '',
              path: '',
              passive: true,
            },
          },
        })
      }

      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET) {
        return new AttachmentStorageService({
          provider: 's3',
          config: {
            minio: {
              endpoint: '',
              access_key: '',
              secret_key: '',
              bucket: '',
              region: '',
              use_ssl: false,
            },
            s3: {
              access_key_id: process.env.AWS_ACCESS_KEY_ID,
              secret_access_key: process.env.AWS_SECRET_ACCESS_KEY || '',
              bucket: process.env.AWS_S3_BUCKET,
              region: process.env.AWS_REGION || 'us-east-1',
            },
            sftp: {
              host: '',
              port: 22,
              username: '',
              password: '',
              path: '',
            },
            ftp: {
              host: '',
              port: 21,
              username: '',
              password: '',
              path: '',
              passive: true,
            },
          },
        })
      }

      return null
    }

    const storage = storageResult.rows[0]
    const config = typeof storage.config === 'string' 
      ? JSON.parse(storage.config) 
      : storage.config

    return new AttachmentStorageService({
      provider: storage.type as 'minio' | 's3',
      config: {
        minio: config.minio || {
          endpoint: '',
          access_key: '',
          secret_key: '',
          bucket: '',
          region: '',
          use_ssl: false,
        },
        s3: config.s3 || {
          access_key_id: '',
          secret_access_key: '',
          bucket: '',
          region: '',
        },
        sftp: {
          host: '',
          port: 22,
          username: '',
          password: '',
          path: '',
        },
        ftp: {
          host: '',
          port: 21,
          username: '',
          password: '',
          path: '',
          passive: true,
        },
      },
    })
  } catch (error) {
    console.error('Error getting storage service:', error)
    return null
  }
}

/**
 * Upload file to storage for import/export jobs
 */
export async function uploadJobFile(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string,
  jobType: 'import' | 'export'
): Promise<{ success: boolean; path?: string; url?: string; error?: string }> {
  const storageService = await getStorageService()
  
  if (!storageService) {
    return {
      success: false,
      error: 'No storage service configured',
    }
  }

  try {
    const folder = jobType === 'import' ? 'imports' : 'exports'
    const fullPath = `${folder}/${fileName}`
    
    const result = await storageService.uploadFile(fullPath, fileBuffer, contentType)
    
    return {
      success: result.success,
      path: result.path,
      url: result.url,
      error: result.error,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Download file from storage for import/export jobs
 */
export async function downloadJobFile(
  filePath: string
): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
  const storageService = await getStorageService()
  
  if (!storageService) {
    return {
      success: false,
      error: 'No storage service configured',
    }
  }

  try {
    const result = await storageService.downloadFile(filePath)
    
    if (!result.success || !result.stream) {
      return {
        success: false,
        error: result.error || 'Download failed',
      }
    }

    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of result.stream) {
      chunks.push(chunk)
    }
    
    return {
      success: true,
      buffer: Buffer.concat(chunks),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    }
  }
}

