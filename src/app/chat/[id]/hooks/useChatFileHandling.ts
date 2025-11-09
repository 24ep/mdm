import { useState, useRef } from 'react'
import toast from 'react-hot-toast'

export interface Attachment {
  type: 'image' | 'video'
  url: string
  name?: string
}

export function useChatFileHandling() {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('Please select an image or video file')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        setAttachments((prev) => [
          ...prev,
          {
            type: file.type.startsWith('image/') ? 'image' : 'video',
            url,
            name: file.name,
          },
        ])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAttachments = () => {
    setAttachments([])
  }

  return {
    attachments,
    setAttachments,
    fileInputRef,
    handleFileSelect,
    removeAttachment,
    clearAttachments,
  }
}

