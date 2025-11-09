import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Import Postman Collection v2.1 format
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const postmanCollection = await request.json()

    if (!postmanCollection.info || !postmanCollection.item) {
      return NextResponse.json(
        { error: 'Invalid Postman collection format' },
        { status: 400 }
      )
    }

    const importedCollections = []

    for (const item of postmanCollection.item) {
      // Create collection
      const collection = await prisma.apiClientCollection.create({
        data: {
          userId: session.user.id,
          name: item.name || 'Imported Collection',
          description: item.description || '',
          requests: {
            create: (item.item || []).map((reqItem: any) => {
              const request = reqItem.request || {}
              const body = request.body || {}
              
              return {
                userId: session.user.id,
                name: reqItem.name || 'Untitled Request',
                method: request.method || 'GET',
                url: typeof request.url === 'string' 
                  ? request.url 
                  : request.url?.raw || '',
                headers: (request.header || []).map((h: any) => ({
                  key: h.key,
                  value: h.value,
                  enabled: !h.disabled
                })),
                body: body.raw ? {
                  type: body.mode === 'raw' ? 'json' : body.mode || 'raw',
                  json: body.mode === 'raw' && body.options?.raw?.language === 'json' 
                    ? body.raw 
                    : undefined,
                  raw: body.raw
                } : undefined,
                description: request.description || '',
                preRequestScript: extractScript(reqItem.event, 'prerequest'),
                tests: extractTests(reqItem.event)
              }
            })
          }
        },
        include: {
          requests: true
        }
      })

      importedCollections.push(collection)
    }

    return NextResponse.json({
      success: true,
      collections: importedCollections,
      count: importedCollections.length
    })
  } catch (error) {
    console.error('Error importing collection:', error)
    return NextResponse.json(
      { error: 'Failed to import collection' },
      { status: 500 }
    )
  }
}

function extractScript(events: any[], listen: string): string | undefined {
  if (!events) return undefined
  const event = events.find((e: any) => e.listen === listen)
  if (!event || !event.script) return undefined
  
  if (Array.isArray(event.script.exec)) {
    return event.script.exec.join('\n')
  }
  return event.script.exec
}

function extractTests(events: any[]): any[] {
  if (!events) return []
  const testEvent = events.find((e: any) => e.listen === 'test')
  if (!testEvent || !testEvent.script) return []
  
  // Parse Postman test scripts (simplified)
  // In production, you'd want a more robust parser
  const testScript = Array.isArray(testEvent.script.exec)
    ? testEvent.script.exec.join('\n')
    : testEvent.script.exec

  // Extract test names and convert to our format
  const testMatches = testScript.matchAll(/pm\.test\(["']([^"']+)["']/g)
  const tests = []
  
  for (const match of testMatches) {
    tests.push({
      name: match[1],
      type: 'custom',
      condition: 'custom',
      expression: 'true' // Simplified
    })
  }

  return tests
}

