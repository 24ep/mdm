'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarSettings {
  backgroundColor: string
  fontColor: string
  size: 'small' | 'medium' | 'large'
  backgroundType: 'color' | 'image'
  backgroundImage: string
}

interface SidebarContextType {
  settings: SidebarSettings
  updateSettings: (newSettings: Partial<SidebarSettings>) => void
  resetSettings: () => void
  isHydrated: boolean
}

const defaultSettings: SidebarSettings = {
  backgroundColor: '#1e40af',
  fontColor: '#ffffff',
  size: 'medium',
  backgroundType: 'color',
  backgroundImage: ''
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SidebarSettings>(defaultSettings)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('sidebar-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        console.log('Loading sidebar settings from localStorage:', parsed)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Failed to parse sidebar settings:', error)
      }
    } else {
      console.log('No saved sidebar settings found, using defaults')
    }
    setIsInitialized(true)
    setIsHydrated(true)
  }, [])

  // Save settings to localStorage whenever they change (but not on initial load)
  useEffect(() => {
    if (isInitialized) {
      console.log('Saving sidebar settings to localStorage:', settings)
      localStorage.setItem('sidebar-settings', JSON.stringify(settings))
    }
  }, [settings, isInitialized])

  const updateSettings = (newSettings: Partial<SidebarSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <SidebarContext.Provider value={{ settings, updateSettings, resetSettings, isHydrated }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
