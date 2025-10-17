'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, X, Upload, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AvatarUploadProps {
  userId: string
  currentAvatar?: string
  userName?: string
  userEmail?: string
  onAvatarChange?: (avatarUrl: string | null) => void
  size?: 'sm' | 'md' | 'lg'
  showUploadButton?: boolean
  disabled?: boolean
}

export function AvatarUpload({
  userId,
  currentAvatar,
  userName,
  userEmail,
  onAvatarChange,
  size = 'md',
  showUploadButton = true,
  disabled = false
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-24 w-24'
  }

  const buttonSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      toast.success('Avatar uploaded successfully')
      setPreview(null)
      onAvatarChange?.(data.avatar)
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    setUploading(true)
    try {
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Remove failed')
      }

      toast.success('Avatar removed successfully')
      onAvatarChange?.(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove avatar')
    } finally {
      setUploading(false)
    }
  }

  const getInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (userEmail) {
      return userEmail[0].toUpperCase()
    }
    return 'U'
  }

  const displayAvatar = preview || currentAvatar

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={displayAvatar || undefined} alt={userName || 'User'} />
          <AvatarFallback className="text-xs">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-full ${sizeClasses[size]}`}>
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          </div>
        )}
      </div>

      {showUploadButton && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              {currentAvatar ? 'Change' : 'Upload'}
            </Button>
            
            {currentAvatar && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeAvatar}
                disabled={uploading || disabled}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, GIF, WebP up to 5MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading || disabled}
      />
    </div>
  )
}
