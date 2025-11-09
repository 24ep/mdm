import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Load policies from database or OpenMetadata
    // For now, return mock data
    const policies = [
      {
        id: '1',
        name: 'PII Data Protection',
        description: 'Protect personally identifiable information',
        rules: [
          {
            id: '1',
            name: 'Mask PII',
            type: 'masking',
            condition: 'tag:pii',
            action: 'mask',
            priority: 1
          }
        ],
        appliesTo: ['database.service.users'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    return NextResponse.json({ policies })
  } catch (error) {
    console.error('Error loading policies:', error)
    return NextResponse.json(
      { error: 'Failed to load policies' },
      { status: 500 }
    )
  }
}

