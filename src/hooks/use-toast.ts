import { toast } from 'react-hot-toast'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

export function useToast() {
  return {
    toast: (options: ToastOptions) => {
      const { title, description, variant = 'default', duration = 3000 } = options
      const message = title && description ? `${title}: ${description}` : title || description || ''
      
      if (variant === 'destructive') {
        return toast.error(message, { duration })
      } else if (variant === 'success') {
        return toast.success(message, { duration })
      } else {
        return toast(message, { duration })
      }
    }
  }
}

