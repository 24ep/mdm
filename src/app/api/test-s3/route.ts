import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test S3 connection
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
        forcePathStyle: true,
      })
    } else {
      // AWS S3 configuration
      s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          sessionToken: process.env.AWS_SESSION_TOKEN,
        },
      })
    }

    // Test connection by listing buckets
    const command = new ListBucketsCommand({})
    const response = await s3Client.send(command)

    return NextResponse.json({
      success: true,
      environment: isMinIO ? 'MinIO (Local)' : 'AWS S3 (Production)',
      buckets: response.Buckets?.map(bucket => ({
        name: bucket.Name,
        creationDate: bucket.CreationDate
      })) || [],
      message: 'S3 connection successful'
    })
  } catch (error) {
    console.error('S3 connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'S3 connection failed'
    }, { status: 500 })
  }
}
