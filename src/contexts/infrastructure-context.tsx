'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface InfrastructureContextType {
  showAddDialog: boolean
  setShowAddDialog: (show: boolean) => void
  showAddVmDialog: boolean
  setShowAddVmDialog: (show: boolean) => void
  showAddServiceDialog: boolean
  setShowAddServiceDialog: (show: boolean) => void
  isProviderActive: boolean
}

const InfrastructureContext = createContext<InfrastructureContextType | undefined>(undefined)

export function InfrastructureProvider({ children }: { children: ReactNode }) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAddVmDialog, setShowAddVmDialog] = useState(false)
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false)

  return (
    <InfrastructureContext.Provider value={{ 
      showAddDialog, 
      setShowAddDialog,
      showAddVmDialog,
      setShowAddVmDialog,
      showAddServiceDialog,
      setShowAddServiceDialog,
      isProviderActive: true 
    }}>
      {children}
    </InfrastructureContext.Provider>
  )
}

export function useInfrastructureContext() {
  const context = useContext(InfrastructureContext)
  if (!context) {
    // Return default values if context is not available (for components used outside the provider)
    return {
      showAddDialog: false,
      setShowAddDialog: () => {},
      showAddVmDialog: false,
      setShowAddVmDialog: () => {},
      showAddServiceDialog: false,
      setShowAddServiceDialog: () => {},
      isProviderActive: false,
    }
  }
  return context
}

