/**
 * Tracing Examples - How to use the tracing system
 * 
 * This file contains examples of how to use the various tracing features.
 * These are examples only and should not be imported in production code.
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  withTracingAndAuth, 
  withTracing 
} from './api-middleware'
import { 
  createChildSpan, 
  startSpan, 
  configureSampling,
  Span 
} from './tracing-middleware'
import {
  traceExternalCall,
  traceDatabaseOperation,
  traceCacheOperation,
  traceJob,
  traceQueueOperation,
  traceComputation,
  configureTracingSampling,
  trace
} from './tracing-helpers'

// ============================================================================
// Example 1: Basic API Route Tracing
// ============================================================================

export async function exampleBasicTracing(request: NextRequest) {
  // Automatically traces the request with default settings
  return withTracing(async (req) => {
    // Your handler code here
    return NextResponse.json({ data: 'example' })
  })(request, {})
}

// ============================================================================
// Example 2: API Route with Authentication and Tracing
// ============================================================================

export async function exampleTracingWithAuth(request: NextRequest) {
  return withTracingAndAuth(async (req, { session }) => {
    // Automatically has tracing + authentication
    return NextResponse.json({ 
      userId: session.user.id 
    })
  }, {
    traceName: 'Get User Data' // Custom trace name
  })(request, {})
}

// ============================================================================
// Example 3: Custom Span Creation
// ============================================================================

export async function exampleCustomSpan() {
  // Create a child span for a specific operation
  const result = await createChildSpan(
    'process.payment',
    async () => {
      // Your operation here
      return { success: true }
    },
    {
      attributes: {
        'payment.amount': 100,
        'payment.currency': 'USD'
      }
    }
  )
  
  return result
}

// ============================================================================
// Example 4: Advanced Span with Events
// ============================================================================

export async function exampleAdvancedSpan() {
  return startSpan(
    'complex.operation',
    async (span: Span) => {
      // Set initial attributes
      span.setAttribute('operation.type', 'data-processing')
      
      // Add events during execution
      span.addEvent('step1.completed', { items: 100 })
      
      // Do some work
      await new Promise(resolve => setTimeout(resolve, 100))
      
      span.addEvent('step2.completed', { items: 200 })
      
      // Do more work
      await new Promise(resolve => setTimeout(resolve, 100))
      
      span.addEvent('step3.completed', { items: 300 })
      
      return { success: true }
    },
    {
      attributes: {
        'operation.complexity': 'high'
      }
    }
  )
}

// ============================================================================
// Example 5: External API Call Tracing
// ============================================================================

export async function exampleExternalCall() {
  return traceExternalCall(
    'payment-gateway',
    '/api/charge',
    async () => {
      // Make external API call
      const response = await fetch('https://api.payment.com/charge', {
        method: 'POST',
        body: JSON.stringify({ amount: 100 })
      })
      return response.json()
    }
  )
}

// ============================================================================
// Example 6: Database Operation Tracing
// ============================================================================

export async function exampleDatabaseTracing() {
  return traceDatabaseOperation(
    'select',
    'users',
    async () => {
      // Database query
      const { query } = await import('./db')
      return query('SELECT * FROM users WHERE id = $1', ['user-id'])
    }
  )
}

// ============================================================================
// Example 7: Cache Operation Tracing
// ============================================================================

export async function exampleCacheTracing() {
  return traceCacheOperation(
    'get',
    'user:123',
    async () => {
      // Cache operation
      // const value = await cache.get('user:123')
      return { cached: true }
    }
  )
}

// ============================================================================
// Example 8: Background Job Tracing
// ============================================================================

export async function exampleJobTracing() {
  return traceJob(
    'email-sender',
    'job-123',
    async () => {
      // Background job logic
      // await sendEmail(...)
      return { sent: true }
    }
  )
}

// ============================================================================
// Example 9: Queue Operation Tracing
// ============================================================================

export async function exampleQueueTracing() {
  return traceQueueOperation(
    'email-queue',
    'publish',
    async () => {
      // Publish to queue
      // await queue.publish('email-queue', message)
      return { published: true }
    }
  )
}

// ============================================================================
// Example 10: Computation Tracing
// ============================================================================

export async function exampleComputationTracing() {
  return traceComputation(
    'data-analysis',
    async () => {
      // Heavy computation
      // const result = await analyzeData(data)
      return { analyzed: true }
    },
    {
      'computation.type': 'analysis',
      'computation.input.size': 1000
    }
  )
}

// ============================================================================
// Example 11: Quick Trace Helper
// ============================================================================

export async function exampleQuickTrace() {
  return trace(
    'quick.operation',
    async () => {
      // Any async operation
      return { done: true }
    },
    {
      'operation.type': 'quick'
    }
  )
}

// ============================================================================
// Example 12: Configure Sampling for High-Traffic Routes
// ============================================================================

export function exampleSamplingConfiguration() {
  // Configure sampling to reduce trace volume for high-traffic routes
  configureTracingSampling({
    sampleRate: 0.1, // Only trace 10% of requests
    alwaysTrace: [
      '/api/admin',      // Always trace admin routes
      '/api/auth',       // Always trace auth routes
      '/api/payment'     // Always trace payment routes
    ],
    neverTrace: [
      '/api/health',     // Never trace health checks
      '/api/metrics'     // Never trace metrics endpoints
    ],
    errorSampleRate: 1.0 // Always trace errors (100%)
  })
}

// ============================================================================
// Example 13: Nested Spans
// ============================================================================

export async function exampleNestedSpans() {
  // Parent span
  return createChildSpan(
    'parent.operation',
    async () => {
      // Child span 1
      await createChildSpan('child.operation1', async () => {
        // Do work
      })
      
      // Child span 2
      await createChildSpan('child.operation2', async () => {
        // Do more work
      })
      
      return { completed: true }
    }
  )
}

// ============================================================================
// Example 14: Error Handling in Traces
// ============================================================================

export async function exampleErrorTracing() {
  try {
    return await createChildSpan(
      'risky.operation',
      async () => {
        // Operation that might fail
        throw new Error('Something went wrong')
      }
    )
  } catch (error) {
    // Error is automatically captured in the trace
    // with error.message, error.type, etc.
    throw error
  }
}


