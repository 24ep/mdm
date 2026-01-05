'use client'

import { useEffect, useState } from 'react'

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [disableRightClick, setDisableRightClick] = useState(false)

  useEffect(() => {
    // Fetch security settings on mount
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.disableRightClick) {
          setDisableRightClick(true)
        }
      })
      .catch(err => console.error('Error fetching security settings:', err))
  }, [])

  useEffect(() => {
    if (disableRightClick) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault()
      }
      
      document.addEventListener('contextmenu', handleContextMenu)
      
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu)
      }
    }
  }, [disableRightClick])

  return <>{children}</>
}
