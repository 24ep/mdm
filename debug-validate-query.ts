
import { NextRequest, NextResponse } from 'next/server'
import { getRequestMetadata } from './src/lib/api-middleware'
import { z } from 'zod'

// Mock implementation of part of api-validation.ts to verify logic
// (Since importing directly might fail if it has other dependencies like logger that use dynamic imports)

// Copying validateQuery logic for isolated test
function validateQuery(
  request: NextRequest,
  schema: any
) {
  try {
    const url = new URL(request.url)
    const queryParams: Record<string, string> = {}
    
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    const validated = schema.parse(queryParams)

    return { success: true, data: validated }
  } catch (error) {
    console.error('Validation Error:', error)
    return { success: false, error }
  }
}

async function main() {
    console.log('Testing validateQuery with NextRequest...')
    try {
        const req = new NextRequest('http://localhost:3000/api/spaces')
        console.log('Request URL:', req.url)
        
        const schema = z.object({
            page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
            limit: z.string().optional().transform((val) => parseInt(val || '10')).pipe(z.number().int().positive().max(100)).optional().default(10),
        })

        const result = validateQuery(req, schema)
        console.log('Result:', result)

        const req2 = new NextRequest('http://localhost:3000/api/spaces?page=2&limit=50')
        console.log('Request 2 URL:', req2.url)
        const result2 = validateQuery(req2, schema)
        console.log('Result 2:', result2)
        
    } catch (e) {
        console.error('Script Error:', e)
    }
}

main()
