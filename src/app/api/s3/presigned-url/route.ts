import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult


    const { key, bucket, expiresIn = 300 } = await request.json()

    if (!key || !bucket) {
      return NextResponse.json(
        { error: 'Key and bucket are required' },
        { status: 400 }
      )
    }

    // Configure S3 client based on environment
    const isProduction = process.env.NODE_ENV === 'production'
    const isMinIO = process.env.MINIO_ENDPOINT && !isProduction

    let s3Client: S3Client

    if (isMinIO) {
      // Local MinIO configuration
      s3Client = new S3Client({
        endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
        },
        forcePathStyle: true, // Required for MinIO
      })
    } else {
      // AWS S3 configuration
      s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          sessionToken: process.env.AWS_SESSION_TOKEN, // For temporary credentials
        },
      })
    }

    // Create the command to get the object
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    // Generate presigned URL
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: Math.min(expiresIn, 3600), // Max 1 hour
    })

    return NextResponse.json({
      success: true,
      url: presignedUrl,
      expiresIn,
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/s3/presigned-url')


export const POST = withErrorHandling(postHandler, 'POST POST /api/s3\presigned-url\route.ts')