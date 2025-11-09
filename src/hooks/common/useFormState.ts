/**
 * Form State Management Hook
 * Common pattern for managing form state with validation
 */

import { useState, useCallback, useMemo } from 'react'

export interface UseFormStateOptions<T> {
  initialValues: T
  validate?: (values: T) => Record<string, string | null>
  onSubmit?: (values: T) => Promise<void> | void
}

export interface UseFormStateReturn<T> {
  values: T
  errors: Record<string, string | null>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
  setValue: (field: keyof T, value: any) => void
  setValues: (values: Partial<T>) => void
  setError: (field: keyof T, error: string | null) => void
  setTouched: (field: keyof T, touched: boolean) => void
  handleChange: (field: keyof T) => (value: any) => void
  handleBlur: (field: keyof T) => () => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
  resetErrors: () => void
}

export function useFormState<T extends Record<string, any>>(
  options: UseFormStateOptions<T>
): UseFormStateReturn<T> {
  const { initialValues, validate, onSubmit } = options

  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isValid = useMemo(() => {
    if (validate) {
      const validationErrors = validate(values)
      return Object.values(validationErrors).every(error => error === null)
    }
    return Object.values(errors).every(error => error === null)
  }, [values, errors, validate])

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: null }))
    }
  }, [errors])

  const setValuesPartial = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }))
  }, [])

  const setError = useCallback((field: keyof T, error: string | null) => {
    setErrors(prev => ({ ...prev, [field as string]: error }))
  }, [])

  const setTouchedField = useCallback((field: keyof T, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [field as string]: isTouched }))
  }, [])

  const handleChange = useCallback((field: keyof T) => {
    return (value: any) => {
      setValue(field, value)
    }
  }, [setValue])

  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      setTouchedField(field, true)
      if (validate) {
        const validationErrors = validate(values)
        if (validationErrors[field as string]) {
          setError(field, validationErrors[field as string])
        }
      }
    }
  }, [values, validate, setTouchedField, setError])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, boolean>)
    setTouched(allTouched)

    // Validate
    if (validate) {
      const validationErrors = validate(values)
      setErrors(validationErrors)
      
      if (Object.values(validationErrors).some(error => error !== null)) {
        return
      }
    }

    // Submit
    if (onSubmit) {
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validate, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const resetErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    values,
    errors, touched, isSubmitting, isValid,
    setValue, setValues: setValuesPartial, setError, setTouched: setTouchedField,
    handleChange, handleBlur, handleSubmit, reset, resetErrors
  }
}

