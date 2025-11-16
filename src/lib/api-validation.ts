/**
 * API Input Validation Utilities
 * Provides Zod-based validation for API route inputs
 */

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

/**
 * Parse and validate JSON body with Zod schema
 */
export async function validateBody<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  try {
    const bodyText = await request.text()
    if (!bodyText) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        ),
      }
    }

    const body = JSON.parse(bodyText)
    const validated = schema.parse(body)

    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Request validation failed', {
        errors: error.issues,
        path: request.url,
      })
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      }
    }

    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        ),
      }
    }

    logger.error('Unexpected error during validation', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  try {
    const url = new URL(request.url)
    const queryParams: Record<string, string> = {}
    
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    const validated = schema.parse(queryParams)

    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Query validation failed', {
        errors: error.issues,
        path: request.url,
      })
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: error.issues.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      }
    }

    logger.error('Unexpected error during query validation', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Validate route parameters (from dynamic routes)
 */
export function validateParams<T extends z.ZodTypeAny>(
  params: Record<string, string | string[] | undefined>,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  try {
    // Convert params to plain object
    const plainParams: Record<string, string> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        plainParams[key] = Array.isArray(value) ? value[0] : value
      }
    }

    const validated = schema.parse(plainParams)

    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Route params validation failed', {
        errors: error.issues,
        params,
      })
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Invalid route parameters',
            details: error.issues.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      }
    }

    logger.error('Unexpected error during params validation', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: z.string().uuid(),
  idOrSlug: z.string().min(1),
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    offset: z.string().transform(Number).pipe(z.number().int().nonnegative()).optional(),
  }),
  sort: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
  search: z.object({
    search: z.string().min(1).max(100).optional(),
    q: z.string().min(1).max(100).optional(), // Alternative search param
  }),
}

