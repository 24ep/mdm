import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Export collections in Postman v2.1 format
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { collectionIds } = await request.json()

    const collections = await prisma.apiClientCollection.findMany({
      where: {
        userId: session.user.id,
        ...(collectionIds && collectionIds.length > 0 && { id: { in: collectionIds } })
      },
      include: {
        requests: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    // Convert to Postman Collection v2.1 format
    const postmanCollection = {
      info: {
        name: 'MDM API Client Export',
        description: 'Exported from MDM API Client',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: 'mdm-api-client'
      },
      item: collections.map(collection => ({
        name: collection.name,
        description: collection.description || '',
        item: collection.requests.map(req => ({
          name: req.name,
          request: {
            method: req.method,
            header: (req.headers as any[]).map(h => ({
              key: h.key,
              value: h.value,
              disabled: !h.enabled
            })),
            body: req.body ? {
              mode: (req.body as any).type === 'json' ? 'raw' : (req.body as any).type,
              raw: (req.body as any).type === 'json' 
                ? (req.body as any).json 
                : (req.body as any).raw || '',
              options: (req.body as any).type === 'json' ? {
                raw: {
                  language: 'json'
                }
              } : undefined
            } : undefined,
            url: {
              raw: req.url,
              host: new URL(req.url).hostname.split('.'),
              path: new URL(req.url).pathname.split('/').filter(Boolean)
            },
            description: req.description || ''
          },
          event: req.preRequestScript ? [{
            listen: 'prerequest',
            script: {
              type: 'text/javascript',
              exec: req.preRequestScript.split('\n')
            }
          }] : undefined,
          event: req.tests && (req.tests as any[]).length > 0 ? [
            ...(req.preRequestScript ? [{
              listen: 'prerequest',
              script: {
                type: 'text/javascript',
                exec: req.preRequestScript.split('\n')
              }
            }] : []),
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: (req.tests as any[]).map(test => {
                  // Convert test to Postman test format
                  return `pm.test("${test.name}", function () {
                    ${generatePostmanTest(test)}
                  });`
                }).join('\n')
              }
            }
          ] : undefined
        }))
      }))
    }

    return NextResponse.json(postmanCollection, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="postman-collection.json"'
      }
    })
  } catch (error) {
    console.error('Error exporting collection:', error)
    return NextResponse.json(
      { error: 'Failed to export collection' },
      { status: 500 }
    )
  }
}

function generatePostmanTest(test: any): string {
  switch (test.type) {
    case 'status':
      if (test.condition === 'equals') {
        return `pm.response.to.have.status(${test.expected});`
      }
      break
    case 'body':
      if (test.condition === 'contains') {
        return `pm.expect(pm.response.text()).to.include("${test.expected}");`
      }
      break
    case 'json':
      if (test.expression) {
        return `pm.expect(pm.response.json().${test.expression}).to.eql(${JSON.stringify(test.expected)});`
      }
      break
    case 'time':
      if (test.condition === 'lessThan') {
        return `pm.expect(pm.response.responseTime).to.be.below(${test.expected});`
      }
      break
  }
  return `// Test: ${test.name}`
}

