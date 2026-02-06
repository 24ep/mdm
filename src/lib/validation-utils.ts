/**
 * Validation Utilities
 * Centralized validation functions
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Normalize space_id by stripping any colon suffix (e.g., "uuid:1" -> "uuid")
 * This handles cases where space_id may have versioning or indexing suffixes
 */
export function normalizeSpaceId(spaceId: string | null | undefined): string | null {
  if (!spaceId) return null
  return spaceId.split(':')[0]
}

/**
 * Normalize and validate space_id
 * Returns the normalized UUID or null if invalid
 */
export function normalizeAndValidateSpaceId(spaceId: string | null | undefined): string | null {
  const normalized = normalizeSpaceId(spaceId)
  if (!normalized || !validateUuid(normalized)) {
    return null
  }
  return normalized
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Validate field name (alphanumeric + underscore, starts with letter)
 */
export function validateFieldName(name: string): string | null {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    return 'Name must start with a letter and contain only letters, numbers, and underscores'
  }
  return null
}

/**
 * Validate number range
 */
export function validateRange(
  value: number,
  min?: number,
  max?: number,
  fieldName: string = 'Value'
): string | null {
  if (min !== undefined && value < min) {
    return `${fieldName} must be at least ${min}`
  }
  if (max !== undefined && value > max) {
    return `${fieldName} must be at most ${max}`
  }
  return null
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number,
  fieldName: string = 'Value'
): string | null {
  if (min !== undefined && value.length < min) {
    return `${fieldName} must be at least ${min} characters`
  }
  if (max !== undefined && value.length > max) {
    return `${fieldName} must be at most ${max} characters`
  }
  return null
}

/**
 * Validate regex pattern
 */
export function validatePattern(
  value: string,
  pattern: string | RegExp,
  errorMessage: string = 'Invalid format'
): string | null {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  if (!regex.test(value)) {
    return errorMessage
  }
  return null
}

/**
 * Run multiple validations
 */
export function validateAll(
  validations: Array<() => string | null>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const validation of validations) {
    const error = validation()
    if (error) {
      errors.push(error)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate file type
 */
export function validateFileType(
  fileName: string,
  allowedTypes: string[]
): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (!extension) return false
  return allowedTypes.some(type => type.toLowerCase() === extension)
}

/**
 * Validate file size
 */
export function validateFileSize(
  fileSize: number,
  maxSizeBytes: number
): string | null {
  if (fileSize > maxSizeBytes) {
    const maxSizeMB = maxSizeBytes / (1024 * 1024)
    return `File size exceeds limit of ${maxSizeMB.toFixed(2)}MB`
  }
  return null
}
