# Migration Examples

This document shows examples of files that have been migrated to use the new best practices utilities.

## Migrated Files

### 1. `src/app/api/data-models/[id]/attributes/route.ts`

**Before:**
```typescript
export async function GET(request: NextRequest, { params }) {
  const { id: dataModelId } = await params
  console.log('GET request for data model:', dataModelId)
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(dataModelId)) {
    console.error('Invalid UUID format:', dataModelId)
    return NextResponse.json({ error: 'Invalid data model ID format' }, { status: 400 })
  }
  
  // ... rest of code
}
```

**After:**
```typescript
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(request: NextRequest, { params }) {
  const startTime = Date.now()
  try {
    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: dataModelId } = paramValidation.data
    logger.apiRequest('GET', `/api/data-models/${dataModelId}/attributes`)
    
    // ... rest of code
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/data-models/${dataModelId}/attributes`, 200, duration)
    return addSecurityHeaders(NextResponse.json(response))
  } catch (error) {
    return handleApiError(error, 'ATTRIBUTES API')
  }
}
```

**Key Changes:**
- ✅ Replaced `console.log` with `logger`
- ✅ Added parameter validation using `validateParams`
- ✅ Added security headers to all responses
- ✅ Added API request/response logging
- ✅ Improved error handling with `handleApiError`

### 2. `src/app/api/data-models/[id]/data/route.ts`

**Before:**
```typescript
export async function POST(request: NextRequest, { params }) {
  const { id: dataModelId } = await params
  console.log('Request received for data model:', dataModelId)
  
  const body = await request.json()
  const { customQuery, filters, limit, offset } = body
  console.log('Request params:', { customQuery, filters, limit, offset })
  
  // ... rest of code
}
```

**After:**
```typescript
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function POST(request: NextRequest, { params }) {
  const startTime = Date.now()
  try {
    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: dataModelId } = paramValidation.data
    logger.apiRequest('POST', `/api/data-models/${dataModelId}/data`)
    
    const bodySchema = z.object({
      customQuery: z.string().optional(),
      filters: z.any().optional(),
      limit: z.number().int().positive().max(1000).optional(),
      offset: z.number().int().nonnegative().optional(),
    })
    
    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const { customQuery, filters, limit, offset } = bodyValidation.data
    logger.debug('Request params', { customQuery: customQuery?.substring(0, 100), filters, limit, offset })
    
    // ... rest of code
  } catch (error) {
    return handleApiError(error, 'DataModelDataAPI')
  }
}
```

**Key Changes:**
- ✅ Replaced `console.log` with `logger`
- ✅ Added parameter validation
- ✅ Added request body validation with Zod schema
- ✅ Added security headers
- ✅ Added API logging

## Migration Checklist

When migrating a file, follow these steps:

1. **Add imports:**
   ```typescript
   import { logger } from '@/lib/logger'
   import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
   import { handleApiError } from '@/lib/api-middleware'
   import { addSecurityHeaders } from '@/lib/security-headers'
   import { z } from 'zod'
   ```

2. **Replace console.log:**
   ```typescript
   // Before
   console.log('Message', data)
   console.error('Error', error)
   
   // After
   logger.info('Message', { data })
   logger.error('Error occurred', error, { context })
   ```

3. **Add parameter validation:**
   ```typescript
   const resolvedParams = await params
   const paramValidation = validateParams(resolvedParams, z.object({
     id: commonSchemas.id,
   }))
   
   if (!paramValidation.success) {
     return addSecurityHeaders(paramValidation.response)
   }
   
   const { id } = paramValidation.data
   ```

4. **Add body validation:**
   ```typescript
   const bodySchema = z.object({
     name: z.string().min(1),
     email: z.string().email(),
   })
   
   const bodyValidation = await validateBody(request, bodySchema)
   if (!bodyValidation.success) {
     return addSecurityHeaders(bodyValidation.response)
   }
   
   const { name, email } = bodyValidation.data
   ```

5. **Add API logging:**
   ```typescript
   const startTime = Date.now()
   logger.apiRequest('POST', '/api/endpoint')
   
   // ... handler code ...
   
   const duration = Date.now() - startTime
   logger.apiResponse('POST', '/api/endpoint', 200, duration)
   ```

6. **Add security headers:**
   ```typescript
   return addSecurityHeaders(NextResponse.json({ data }))
   ```

7. **Improve error handling:**
   ```typescript
   } catch (error) {
     return handleApiError(error, 'API Context')
   }
   ```

## Next Steps

Continue migrating other API routes following the same pattern. Priority files:
- `src/app/api/data-models/[id]/attributes/[attrId]/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/app/api/tickets/[id]/route.ts`
- Other frequently used API routes
