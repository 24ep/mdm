import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || undefined, // For MinIO or other S3-compatible services
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Required for MinIO
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_KEY || '',
  },
})

export { s3Client }

// Generate presigned URL for downloading files
export async function generatePresignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn: number = 300 // 5 minutes default
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    return presignedUrl
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw new Error('Failed to generate download URL')
  }
}

// Validate S3 configuration
export function validateS3Config(): boolean {
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
  ]

  // Check for MinIO fallback
  const minioEnvVars = [
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
  ]

  const hasAwsConfig = requiredEnvVars.every(envVar => process.env[envVar])
  const hasMinioConfig = minioEnvVars.every(envVar => process.env[envVar])

  return hasAwsConfig || hasMinioConfig
}
