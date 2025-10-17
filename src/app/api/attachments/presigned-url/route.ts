import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePresignedDownloadUrl, validateS3Config } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate S3 configuration
    if (!validateS3Config()) {
      return NextResponse.json(
        { error: 'S3 configuration is missing' },
        { status: 500 }
      )
    }

    const { bucket, key, expiresIn } = await request.json()

    if (!bucket || !key) {
      return NextResponse.json(
        { error: 'Bucket and key are required' },
        { status: 400 }
      )
    }

    // Validate that the key is a valid attachment path
    if (!key.startsWith('attachments/')) {
      return NextResponse.json(
        { error: 'Invalid attachment key' },
        { status: 400 }
      )
    }

    // Generate presigned URL with short expiry (5-10 minutes)
    const presignedUrl = await generatePresignedDownloadUrl(
      bucket,
      key,
      expiresIn || 300 // 5 minutes default
    )

    return NextResponse.json({
      success: true,
      presignedUrl,
      expiresIn: expiresIn || 300,
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}
