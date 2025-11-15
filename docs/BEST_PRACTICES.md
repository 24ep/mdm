# Best Practices Guide

This document outlines the best practices implemented in the codebase and how to use them.

## 📋 Table of Contents

1. [Logging](#logging)
2. [Environment Variables](#environment-variables)
3. [API Input Validation](#api-input-validation)
4. [Security Headers](#security-headers)
5. [Code Quality](#code-quality)
6. [TypeScript Configuration](#typescript-configuration)

## 🔍 Logging

### Overview

We use a centralized logging system (`src/lib/logger.ts`) instead of `console.log` statements. This provides:

- Structured logging with timestamps
- Environment-aware log levels (only errors/warnings in production)
- Consistent formatting
- Easy integration with logging services

### Usage

```typescript
import { logger } from '@/lib/logger'

// Basic logging
logger.info('User logged in', { userId: '123' })
logger.warn('Rate limit approaching', { remaining: 5 })
logger.error('Database connection failed', error, { host: 'db.example.com' })
logger.debug('Query executed', { query: 'SELECT * FROM users', duration: 45 })

// API-specific logging
logger.apiRequest('POST', '/api/users', { userId: '123' })
logger.apiResponse('POST', '/api/users', 201, 150, { userId: '123' })

// Database-specific logging
logger.dbQuery('SELECT * FROM users', 45, { userId: '123' })
logger.dbError('SELECT * FROM users', error, { userId: '123' })
```

### Migration from console.log

Replace:
```typescript
console.log('User logged in', userId)
console.error('Error:', error)
```

With:
```typescript
logger.info('User logged in', { userId })
logger.error('Error occurred', error)
```

## 🔐 Environment Variables

### Overview

Environment variables are validated at startup using Zod schemas (`src/lib/env.ts`). This ensures:

- Required variables are present
- Variables have correct types
- Early failure if configuration is invalid
- Type-safe access to environment variables

### Usage

```typescript
import { env, getEnv, isDevelopment, isProduction } from '@/lib/env'

// Type-safe access
const dbUrl = env.DATABASE_URL
const isDev = isDevelopment()

// With fallback
const apiUrl = getEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3000')
```

### Adding New Environment Variables

1. Add to `env.example` with documentation
2. Add to the schema in `src/lib/env.ts`:
```typescript
const envSchema = z.object({
  // ... existing vars
  NEW_VAR: z.string().min(1), // Required
  OPTIONAL_VAR: z.string().optional(), // Optional
})
```

## ✅ API Input Validation

### Overview

Use Zod schemas to validate API inputs (`src/lib/api-validation.ts`). This provides:

- Type-safe request handling
- Automatic error responses
- Consistent validation across routes

### Usage

```typescript
import { validateBody, validateQuery, validateParams, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

// Validate request body
const bodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
})

export async function POST(request: NextRequest) {
  const validation = await validateBody(request, bodySchema)
  if (!validation.success) {
    return validation.response
  }
  
  const { name, email, age } = validation.data
  // TypeScript knows the types here!
}

// Validate query parameters
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const validation = validateQuery(request, querySchema)
  if (!validation.success) {
    return validation.response
  }
  
  const { page, search } = validation.data
}

// Validate route parameters
const paramsSchema = z.object({
  id: commonSchemas.id,
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const validation = validateParams(resolvedParams, paramsSchema)
  if (!validation.success) {
    return validation.response
  }
  
  const { id } = validation.data
}
```

### Common Schemas

Pre-defined schemas are available in `commonSchemas`:

```typescript
commonSchemas.id          // UUID string
commonSchemas.idOrSlug    // String (min 1 char)
commonSchemas.pagination  // { page?, limit?, offset? }
commonSchemas.sort        // { sortBy?, sortOrder? }
commonSchemas.search      // { search?, q? }
```

## 🛡️ Security Headers

### Overview

Security headers are automatically added to all responses via Next.js middleware (`src/middleware.ts`). This includes:

- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict Transport Security
- And more...

### Usage

Headers are added automatically. For API routes, you can also manually add them:

```typescript
import { addSecurityHeaders } from '@/lib/security-headers'

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ data: '...' })
  return addSecurityHeaders(response)
}
```

### CORS Configuration

CORS is handled automatically for API routes. Configure allowed origins in `.env.local`:

```env
ALLOWED_ORIGINS=http://localhost:3000,https://example.com
```

## 📝 Code Quality

### ESLint

ESLint is configured to catch common issues. Run:

```bash
npm run lint          # Check for issues
npm run lint:fix       # Auto-fix issues
```

### Prettier

Prettier ensures consistent code formatting. Run:

```bash
npm run format         # Format all files
npm run format:check   # Check formatting without changing files
```

### TypeScript

Type checking is enforced:

```bash
npm run type-check     # Check types without building
```

### Configuration Files

- `.eslintrc.json` - ESLint rules
- `.prettierrc.json` - Prettier formatting rules
- `tsconfig.json` - TypeScript configuration

## 🔧 TypeScript Configuration

### Strict Mode

TypeScript strict mode is enabled. The build will fail on TypeScript errors in production:

```typescript
// next.config.js
typescript: {
  ignoreBuildErrors: process.env.NODE_ENV === 'development',
}
```

### Best Practices

1. **Avoid `any` types** - Use proper types or `unknown`
2. **Use type inference** - Let TypeScript infer types when possible
3. **Define interfaces** - Use interfaces for object shapes
4. **Use type guards** - Check types at runtime when needed

## 🚀 Migration Checklist

To migrate existing code to use these best practices:

- [ ] Replace `console.log/error/warn` with `logger`
- [ ] Replace direct `process.env` access with `env` or `getEnv()`
- [ ] Add input validation to API routes using `validateBody/Query/Params`
- [ ] Ensure security headers are added (automatic via middleware)
- [ ] Run `npm run lint:fix` to fix linting issues
- [ ] Run `npm run format` to format code
- [ ] Run `npm run type-check` to verify types

## 📚 Additional Resources

- [Zod Documentation](https://zod.dev/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)

