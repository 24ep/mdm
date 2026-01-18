import { useState, useEffect } from 'react'
import { LayoutDashboard, ClipboardList, Workflow, Layers, FileIcon, Settings, FileText } from 'lucide-react'

export function useIconLoader() {
  const [allIcons, setAllIcons] = useState<Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>>([])
  const [reactIcons, setReactIcons] = useState<Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>>([])
  
  useEffect(() => {
    // Load Lucide icons
    import('lucide-react').then((icons) => {
      const iconList = Object.entries(icons)
        .filter(([name]) => name[0] === name[0]?.toUpperCase() && typeof icons[name as keyof typeof icons] === 'function')
        .map(([name, Icon]: [string, any]) => ({
          name,
          icon: Icon as React.ComponentType<{ className?: string }>,
          library: 'lucide'
        }))
      setAllIcons(iconList)
    }).catch(err => console.warn('Failed to load lucide-react icons', err))
    
    // Load React Icons (from multiple libraries)
    // Only attempt to load if react-icons is available
    // Using Function constructor to prevent Next.js build-time analysis
    const loadReactIcons = async () => {
      try {
        // Use Function constructor to create dynamic imports that Next.js won't analyze
        const createDynamicImport = (path: string) => {
          // Use eval-style dynamic import that Next.js can't analyze
          return new Function('return import("' + path + '")')()
        }
        
        // Load libraries one by one to avoid build-time analysis
        const loadLibrary = async (prefix: string) => {
          try {
            // @ts-ignore - react-icons may not be installed, errors are handled gracefully
            const icons = await createDynamicImport(`react-icons/${prefix}`)
            return { prefix, icons }
          } catch {
            return null
          }
        }
        
        // @ts-ignore - react-icons may not be installed, errors are handled gracefully
        const iconSets = await Promise.all([
          loadLibrary('fa'),
          loadLibrary('md'),
          loadLibrary('fi'),
          loadLibrary('ai'),
          loadLibrary('bs'),
          loadLibrary('hi'),
          // Adding Heroicons support
          (async () => {
            try {
              const icons = await createDynamicImport('@heroicons/react/24/outline')
              return { prefix: 'ho', icons } // 'ho' for Heroicons Outline
            } catch { return null }
          })(),
          (async () => {
            try {
              const icons = await createDynamicImport('@heroicons/react/24/solid')
              return { prefix: 'hs', icons } // 'hs' for Heroicons Solid
            } catch { return null }
          })(),
        ])
        
        const validSets = iconSets.filter(set => set !== null) as Array<{ prefix: string; icons: any }>
        const allReactIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }> = []
        
        validSets.forEach(({ prefix, icons }) => {
          Object.entries(icons).forEach(([name, Icon]: [string, any]) => {
            if (typeof Icon === 'function' || (typeof Icon === 'object' && '$$typeof' in Icon)) {
              allReactIcons.push({
                name: `${prefix}-${name}`,
                icon: Icon as React.ComponentType<{ className?: string }>,
                library: prefix
              })
            }
          })
        })
        
        setReactIcons(allReactIcons)
      } catch (err) {
        // react-icons or heroicons not available, silently continue without it
        console.warn('Icon sets not fully available, using Lucide icons only', err)
        setReactIcons([])
      }

    }
    
    loadReactIcons()
  }, [])
  
  return { allIcons, reactIcons }
}

