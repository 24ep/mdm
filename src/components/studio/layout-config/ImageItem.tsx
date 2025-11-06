'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Trash, Image as ImageIcon, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { UnifiedPage } from './types'
import { SpacesEditorPage } from '@/lib/space-studio-manager'

interface ImageItemProps {
  page: UnifiedPage
  index: number
  isMobileViewport: boolean
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
}

export function ImageItem({
  page,
  index,
  isMobileViewport,
  allPages,
  pages,
  handlePageReorder,
  setAllPages,
}: ImageItemProps) {
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string>(page.imageUrl || '')
  const [imageAlt, setImageAlt] = useState<string>(page.imageAlt || 'Logo')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = editingImageId === page.id

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImageUrl(result)
        setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, imageUrl: result, name: 'Logo' } : x))
        toast.success('Image uploaded')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
  }

  return (
    <div
      key={page.id}
      className={`flex items-center gap-2 ${isMobileViewport ? 'px-3 py-2' : 'px-4 py-1.5'} rounded-[10px] border hover:bg-muted select-none`}
    >
      <ImageIcon className={`${isMobileViewport ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground`} />
      {isEditing ? (
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={imageAlt}
                className={`${isMobileViewport ? 'h-8 w-8' : 'h-6 w-6'} object-contain rounded border`}
              />
            ) : (
              <div className={`${isMobileViewport ? 'h-8 w-8' : 'h-6 w-6'} rounded border border-dashed flex items-center justify-center`}>
                <ImageIcon className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className={isMobileViewport ? "h-7" : "h-6 text-xs"}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Upload className={`${isMobileViewport ? 'h-3 w-3' : 'h-2.5 w-2.5'} mr-1`} />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onBlur={() => {
              setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, imageUrl, imageAlt, name: 'Logo' } : x))
              setEditingImageId(null)
            }}
            placeholder="Image URL"
            className="h-6 text-xs"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <Input
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            onBlur={() => {
              setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, imageUrl, imageAlt, name: imageAlt || 'Logo' } : x))
            }}
            placeholder="Alt text"
            className="h-6 text-xs"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={imageAlt}
              className={`${isMobileViewport ? 'h-8 w-8' : 'h-6 w-6'} object-contain rounded border`}
            />
          ) : (
            <div className={`${isMobileViewport ? 'h-8 w-8' : 'h-6 w-6'} rounded border border-dashed flex items-center justify-center`}>
              <ImageIcon className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <span className="text-xs text-muted-foreground">{imageAlt || 'Logo'}</span>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <MoreVertical className={isMobileViewport ? "h-4 w-4" : "h-3.5 w-3.5"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            setEditingImageId(page.id)
            setImageUrl(page.imageUrl || '')
            setImageAlt(page.imageAlt || 'Logo')
          }} className="cursor-pointer">
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>Edit Image</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            setAllPages((prev) => prev.filter((x) => x.id !== page.id))
            toast.success('Image removed')
          }} className="cursor-pointer text-destructive focus:text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

