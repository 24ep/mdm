/**
 * Response Validator
 * Validates API responses against JSON schemas
 */

export interface ValidationResult {
  valid: boolean
  errors: Array<{
    path: string
    message: string
  }>
}

/**
 * Simple JSON Schema validator
 * For production, use a library like ajv
 */
export function validateResponse(
  data: any,
  schema: {
    type?: string
    properties?: Record<string, any>
    required?: string[]
    items?: any
  }
): ValidationResult {
  const errors: Array<{ path: string; message: string }> = []

  function validate(value: any, schemaPart: any, path: string = '') {
    if (schemaPart.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value

      if (schemaPart.type === 'array' && !Array.isArray(value)) {
        errors.push({
          path,
          message: `Expected array, got ${actualType}`
        })
        return
      }

      if (schemaPart.type === 'object' && (actualType !== 'object' || Array.isArray(value))) {
        errors.push({
          path,
          message: `Expected object, got ${actualType}`
        })
        return
      }

      if (schemaPart.type !== 'array' && schemaPart.type !== 'object' && actualType !== schemaPart.type) {
        errors.push({
          path,
          message: `Expected ${schemaPart.type}, got ${actualType}`
        })
      }
    }

    if (schemaPart.required && Array.isArray(schemaPart.required)) {
      for (const field of schemaPart.required) {
        if (value[field] === undefined) {
          errors.push({
            path: path ? `${path}.${field}` : field,
            message: `Required field '${field}' is missing`
          })
        }
      }
    }

    if (schemaPart.properties && typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, propSchema] of Object.entries(schemaPart.properties)) {
        if (value[key] !== undefined) {
          validate(value[key], propSchema as any, path ? `${path}.${key}` : key)
        }
      }
    }

    if (schemaPart.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        validate(item, schemaPart.items, `${path}[${index}]`)
      })
    }
  }

  validate(data, schema)

  return {
    valid: errors.length === 0,
    errors
  }
}

