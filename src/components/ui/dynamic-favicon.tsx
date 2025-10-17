'use client'

import { useEffect, useState } from 'react'

interface DynamicFaviconProps {
  faviconUrl?: string
}

export function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(null)

  useEffect(() => {
    if (faviconUrl) {
      setCurrentFavicon(faviconUrl)
    } else {
      // Load favicon from settings
      const loadFavicon = async () => {
        try {
          const response = await fetch('/api/settings')
          if (response.ok) {
            const settings = await response.json()
            if (settings.faviconUrl) {
              setCurrentFavicon(settings.faviconUrl)
            }
          }
        } catch (error) {
          console.error('Error loading favicon from settings:', error)
        }
      }
      loadFavicon()
    }
  }, [faviconUrl])

  useEffect(() => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"]')
    existingLinks.forEach(link => link.remove())

    if (currentFavicon) {
      // Create new favicon link
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = currentFavicon
      link.type = currentFavicon.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon'
      
      document.head.appendChild(link)

      // Also add apple-touch-icon for better mobile support
      const appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = currentFavicon
      document.head.appendChild(appleLink)
    } else {
      // Set default favicon if none is configured
      const defaultLink = document.createElement('link')
      defaultLink.rel = 'icon'
      defaultLink.href = '/favicon.svg'
      defaultLink.type = 'image/svg+xml'
      document.head.appendChild(defaultLink)
    }
  }, [currentFavicon])

  return null // This component doesn't render anything
}
