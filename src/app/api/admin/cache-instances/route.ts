import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock cache instances data
    const instances = [
      {
        id: '1',
        name: 'Redis Primary',
        type: 'redis',
        host: 'localhost',
        port: 6379,
        isActive: true,
        status: 'connected',
        lastConnected: new Date(),
        memory: {
          used: 256 * 1024 * 1024, // 256MB
          total: 512 * 1024 * 1024, // 512MB
          peak: 400 * 1024 * 1024 // 400MB
        },
        stats: {
          hits: 15000,
          misses: 2000,
          evictions: 50,
          expired: 100,
          keys: 5000
        }
      },
      {
        id: '2',
        name: 'Memcached Cluster',
        type: 'memcached',
        host: 'localhost',
        port: 11211,
        isActive: true,
        status: 'connected',
        lastConnected: new Date(),
        memory: {
          used: 128 * 1024 * 1024, // 128MB
          total: 256 * 1024 * 1024, // 256MB
          peak: 200 * 1024 * 1024 // 200MB
        },
        stats: {
          hits: 8000,
          misses: 1000,
          evictions: 25,
          expired: 75,
          keys: 2500
        }
      }
    ]

    return NextResponse.json({ instances })
  } catch (error) {
    console.error('Error fetching cache instances:', error)
    return NextResponse.json({ error: 'Failed to fetch cache instances' }, { status: 500 })
  }
}
