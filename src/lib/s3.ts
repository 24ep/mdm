import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let s3ClientInstance: S3Client | null = null
let cachedConfigTime = 0

async function getS3Config() {
  // 1. Try DB first
  try {
    const { query } = await import('@/lib/db')
    const sql = `
      SELECT config, is_enabled
      FROM platform_integrations
      WHERE type = 'aws-s3'
        AND deleted_at IS NULL
        AND is_enabled = true
      LIMIT 1
    `
    const { rows } = await query(sql, [], 5000)
    
    if (rows && rows.length > 0) {
      const config = rows[0].config as any
      if (config.accessKeyId && config.secretAccessKey) {
        return {
          region: config.region || process.env.AWS_REGION || 'us-east-1',
          endpoint: config.endpoint || process.env.S3_ENDPOINT || undefined,
          forcePathStyle: config.forcePathStyle === true || config.forcePathStyle === 'true' || process.env.S3_FORCE_PATH_STYLE === 'true',
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        }
      }
    }
  } catch (error) {
    // Ignore DB errors
  }

  // 2. Fallback to Env
  return {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_KEY || '',
    },
  }
}

export async function getS3Client(): Promise<S3Client> {
  const now = Date.now()
  if (!s3ClientInstance || (now - cachedConfigTime > CONFIG_CACHE_TTL)) {
    const config = await getS3Config()
    s3ClientInstance = new S3Client(config)
    cachedConfigTime = now
  }
  return s3ClientInstance
}

// Generate presigned URL for downloading files
export async function generatePresignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn: number = 300 // 5 minutes default
): Promise<string> {
  try {
    const client = await getS3Client()
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const presignedUrl = await getSignedUrl(client, command, { expiresIn })
    return presignedUrl
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw new Error('Failed to generate download URL')
  }
}

// Validate S3 configuration
export async function validateS3Config(): Promise<boolean> {
  const config = await getS3Config()
  return !!(config.credentials.accessKeyId && config.credentials.secretAccessKey)
}
