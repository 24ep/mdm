/**
 * Toast Notification Utilities
 * Standardized toast notification helpers
 */

import toast from 'react-hot-toast'

export interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  icon?: string | React.ReactNode
}

/**
 * Show success toast
 */
export function showSuccess(message: string, options?: ToastOptions) {
  const { icon, ...restOptions } = options || {}
  return toast.success(message, {
    duration: restOptions.duration || 3000,
    position: restOptions.position || 'top-right',
    ...restOptions,
    ...(icon ? { icon: icon as any } : {})
  })
}

/**
 * Show error toast
 */
export function showError(message: string, options?: ToastOptions) {
  const { icon, ...restOptions } = options || {}
  return toast.error(message, {
    duration: restOptions.duration || 4000,
    position: restOptions.position || 'top-right',
    ...restOptions,
    ...(icon ? { icon: icon as any } : {})
  })
}

/**
 * Show info toast
 */
export function showInfo(message: string, options?: ToastOptions) {
  const { icon, ...restOptions } = options || {}
  return toast(message, {
    duration: restOptions.duration || 3000,
    position: restOptions.position || 'top-right',
    icon: (icon || 'ℹ️') as any,
    ...restOptions
  })
}

/**
 * Show warning toast
 */
export function showWarning(message: string, options?: ToastOptions) {
  const { icon, ...restOptions } = options || {}
  return toast(message, {
    duration: restOptions.duration || 3500,
    position: restOptions.position || 'top-right',
    icon: (icon || '⚠️') as any,
    ...restOptions
  })
}

/**
 * Show loading toast (returns dismiss function)
 */
export function showLoading(message: string, options?: ToastOptions) {
  const { icon, ...restOptions } = options || {}
  return toast.loading(message, {
    position: restOptions.position || 'top-right',
    ...restOptions,
    ...(icon ? { icon: icon as any } : {})
  })
}

/**
 * Dismiss toast by ID
 */
export function dismissToast(toastId: string) {
  toast.dismiss(toastId)
}

/**
 * Common toast messages
 */
export const ToastMessages = {
  // Success messages
  SAVED: 'Saved successfully',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  COPIED: 'Copied to clipboard',
  UPLOADED: 'File uploaded successfully',
  DOWNLOADED: 'File downloaded successfully',
  
  // Error messages
  SAVE_ERROR: 'Failed to save',
  CREATE_ERROR: 'Failed to create',
  UPDATE_ERROR: 'Failed to update',
  DELETE_ERROR: 'Failed to delete',
  LOAD_ERROR: 'Failed to load data',
  NETWORK_ERROR: 'Network error. Please try again.',
  UPLOAD_ERROR: 'Failed to upload file',
  DOWNLOAD_ERROR: 'Failed to download file',
  
  // Info messages
  LOADING: 'Loading...',
  PROCESSING: 'Processing...',
  SAVING: 'Saving...',
} as const
