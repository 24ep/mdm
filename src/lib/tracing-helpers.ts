/**
 * Tracing Helpers - Convenience functions for common tracing operations
 */

import { createChildSpan, startSpan, configureSampling, Span } from './tracing-middleware'

/**
 * Trace an external API call
 */
export async function traceExternalCall<T>(
  serviceName: string,
  endpoint: string,
  operation: () => Promise<T>
): Promise<T> {
  return createChildSpan(
    `external.${serviceName}.call`,
    operation,
    {
      kind: 'CLIENT',
      attributes: {
        'external.service': serviceName,
        'external.endpoint': endpoint,
        'external.type': 'http'
      }
    }
  )
}

/**
 * Trace a database operation
 */
export async function traceDatabaseOperation<T>(
  operation: string,
  operationFn: () => Promise<T>,
  table?: string
): Promise<T> {
  return createChildSpan(
    `db.${operation}`,
    operationFn,
    {
      kind: 'INTERNAL',
      attributes: {
        'db.operation': operation,
        ...(table && { 'db.table': table })
      }
    }
  )
}

/**
 * Trace a cache operation
 */
export async function traceCacheOperation<T>(
  operation: 'get' | 'set' | 'delete',
  key: string,
  operationFn: () => Promise<T>
): Promise<T> {
  return createChildSpan(
    `cache.${operation}`,
    operationFn,
    {
      kind: 'INTERNAL',
      attributes: {
        'cache.operation': operation,
        'cache.key': key
      }
    }
  )
}

/**
 * Trace a file operation
 */
export async function traceFileOperation<T>(
  operation: 'read' | 'write' | 'delete',
  filePath: string,
  operationFn: () => Promise<T>
): Promise<T> {
  return createChildSpan(
    `file.${operation}`,
    operationFn,
    {
      kind: 'INTERNAL',
      attributes: {
        'file.operation': operation,
        'file.path': filePath
      }
    }
  )
}

/**
 * Trace a background job
 */
export async function traceJob<T>(
  jobName: string,
  jobId: string,
  operationFn: () => Promise<T>
): Promise<T> {
  return startSpan(
    `job.${jobName}`,
    async (span: Span) => {
      span.setAttributes({
        'job.name': jobName,
        'job.id': jobId,
        'job.type': 'background'
      })
      return await operationFn()
    },
    {
      kind: 'PRODUCER',
      attributes: {
        'job.name': jobName,
        'job.id': jobId
      }
    }
  )
}

/**
 * Trace a message queue operation
 */
export async function traceQueueOperation<T>(
  queueName: string,
  operation: 'publish' | 'consume',
  operationFn: () => Promise<T>
): Promise<T> {
  return createChildSpan(
    `queue.${queueName}.${operation}`,
    operationFn,
    {
      kind: operation === 'publish' ? 'PRODUCER' : 'CONSUMER',
      attributes: {
        'queue.name': queueName,
        'queue.operation': operation
      }
    }
  )
}

/**
 * Trace a computation-heavy operation
 */
export async function traceComputation<T>(
  operationName: string,
  operationFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return createChildSpan(
    `compute.${operationName}`,
    operationFn,
    {
      kind: 'INTERNAL',
      attributes: {
        'compute.operation': operationName,
        ...metadata
      }
    }
  )
}

/**
 * Configure sampling for high-traffic routes
 * Example usage:
 *   configureTracingSampling({
 *     sampleRate: 0.1, // 10% of requests
 *     alwaysTrace: ['/api/admin', '/api/auth'], // Always trace admin/auth
 *     neverTrace: ['/api/health'], // Never trace health checks
 *     errorSampleRate: 1.0 // Always trace errors
 *   })
 */
export function configureTracingSampling(config: {
  sampleRate?: number
  alwaysTrace?: string[]
  neverTrace?: string[]
  errorSampleRate?: number
}): void {
  configureSampling(config)
}

/**
 * Quick helper to trace any async operation
 */
export async function trace<T>(
  name: string,
  operation: () => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> {
  return createChildSpan(name, operation, {
    attributes: attributes || {}
  })
}




