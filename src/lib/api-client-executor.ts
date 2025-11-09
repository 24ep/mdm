/**
 * API Client Executor
 * Handles pre-request scripts, test execution, and response validation
 */

export interface ExecuteOptions {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
  preRequestScript?: string
  tests?: Array<{
    name: string
    type: 'status' | 'header' | 'body' | 'json' | 'time' | 'custom'
    condition: string
    expected?: any
    expression?: string
  }>
  environment?: Record<string, string>
}

export interface ExecuteResult {
  response: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: string
    size: number
    time: number
    timestamp: string
  }
  testResults?: Array<{
    name: string
    passed: boolean
    error?: string
  }>
  error?: string
}

/**
 * Execute pre-request script in a sandboxed environment
 */
export function executePreRequestScript(
  script: string,
  context: {
    method: string
    url: string
    headers: Record<string, string>
    body?: string
    environment?: Record<string, string>
  }
): {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
} {
  if (!script) {
    return {
      method: context.method,
      url: context.url,
      headers: context.headers,
      body: context.body
    }
  }

  try {
    // Create a safe execution context
    const sandbox = {
      method: context.method,
      url: context.url,
      headers: { ...context.headers },
      body: context.body,
      environment: context.environment || {},
      // Helper functions
      setHeader: (key: string, value: string) => {
        sandbox.headers[key] = value
      },
      removeHeader: (key: string) => {
        delete sandbox.headers[key]
      },
      setBody: (body: string) => {
        sandbox.body = body
      },
      getEnvironmentVariable: (key: string) => {
        return sandbox.environment[key] || ''
      }
    }

    // Execute script (in production, use a proper sandbox like vm2)
    // For now, we'll use a simple eval with restricted context
    const func = new Function(
      'method',
      'url',
      'headers',
      'body',
      'environment',
      'setHeader',
      'removeHeader',
      'setBody',
      'getEnvironmentVariable',
      script
    )

    func(
      sandbox.method,
      sandbox.url,
      sandbox.headers,
      sandbox.body,
      sandbox.environment,
      sandbox.setHeader,
      sandbox.removeHeader,
      sandbox.setBody,
      sandbox.getEnvironmentVariable
    )

    return {
      method: sandbox.method,
      url: sandbox.url,
      headers: sandbox.headers,
      body: sandbox.body
    }
  } catch (error) {
    console.error('Pre-request script error:', error)
    // Return original context if script fails
    return {
      method: context.method,
      url: context.url,
      headers: context.headers,
      body: context.body
    }
  }
}

/**
 * Execute test assertions
 */
export function executeTests(
  tests: Array<{
    name: string
    type: 'status' | 'header' | 'body' | 'json' | 'time' | 'custom'
    condition: string
    expected?: any
    expression?: string
  }>,
  response: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: string
    time: number
  }
): Array<{ name: string; passed: boolean; error?: string }> {
  if (!tests || tests.length === 0) {
    return []
  }

  return tests.map(test => {
    try {
      let passed = false

      switch (test.type) {
        case 'status':
          if (test.condition === 'equals') {
            passed = response.status === test.expected
          } else if (test.condition === 'greaterThan') {
            passed = response.status > test.expected
          } else if (test.condition === 'lessThan') {
            passed = response.status < test.expected
          } else if (test.condition === 'between') {
            const [min, max] = test.expected
            passed = response.status >= min && response.status <= max
          }
          break

        case 'header':
          const headerValue = response.headers[test.expected?.key?.toLowerCase()] ||
                            response.headers[test.expected?.key]
          if (test.condition === 'exists') {
            passed = !!headerValue
          } else if (test.condition === 'equals') {
            passed = headerValue === test.expected?.value
          } else if (test.condition === 'contains') {
            passed = headerValue?.includes(test.expected?.value)
          }
          break

        case 'body':
          if (test.condition === 'contains') {
            passed = response.body.includes(test.expected)
          } else if (test.condition === 'equals') {
            passed = response.body === test.expected
          } else if (test.condition === 'matches') {
            const regex = new RegExp(test.expected)
            passed = regex.test(response.body)
          }
          break

        case 'json':
          try {
            const json = JSON.parse(response.body)
            if (test.expression) {
              // Evaluate JSONPath-like expression
              const value = evaluateJsonPath(json, test.expression)
              if (test.condition === 'equals') {
                passed = JSON.stringify(value) === JSON.stringify(test.expected)
              } else if (test.condition === 'exists') {
                passed = value !== undefined && value !== null
              } else if (test.condition === 'type') {
                passed = typeof value === test.expected
              }
            }
          } catch {
            passed = false
          }
          break

        case 'time':
          if (test.condition === 'lessThan') {
            passed = response.time < test.expected
          } else if (test.condition === 'greaterThan') {
            passed = response.time > test.expected
          }
          break

        case 'custom':
          if (test.expression) {
            try {
              // Evaluate custom JavaScript expression
              const func = new Function('response', `return ${test.expression}`)
              passed = !!func(response)
            } catch {
              passed = false
            }
          }
          break
      }

      return {
        name: test.name,
        passed,
        error: passed ? undefined : `Test failed: ${test.name}`
      }
    } catch (error) {
      return {
        name: test.name,
        passed: false,
        error: error instanceof Error ? error.message : 'Test execution error'
      }
    }
  })
}

/**
 * Simple JSONPath evaluator
 */
function evaluateJsonPath(obj: any, path: string): any {
  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (part.includes('[')) {
      const [key, index] = part.split('[')
      const idx = parseInt(index.replace(']', ''))
      if (key) {
        current = current[key]
      }
      current = current?.[idx]
    } else {
      current = current?.[part]
    }
    if (current === undefined || current === null) {
      return undefined
    }
  }

  return current
}

