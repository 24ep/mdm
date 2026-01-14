'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface SystemSettings {
    appName: string
    deletePolicyDays: number
    enableAuditTrail: boolean
    enableNotifications: boolean
    enableThemeConfig: boolean
    enableUserRegistration: boolean
    requireEmailVerification: boolean
    requireAdminApproval: boolean
}

interface SystemSettingsContextType {
    settings: SystemSettings
    isLoading: boolean
    error: string | null
    refreshSettings: () => Promise<void>
    updateSettings: (newSettings: Partial<SystemSettings>) => Promise<boolean>
}

const defaultSettings: SystemSettings = {
    appName: 'Unified Data Platform',
    deletePolicyDays: 30,
    enableAuditTrail: true,
    enableNotifications: true,
    enableThemeConfig: true,
    enableUserRegistration: true,
    requireEmailVerification: true,
    requireAdminApproval: false
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined)

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refreshSettings = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch('/api/system-settings')
            const data = await response.json()

            if (data.success && data.settings) {
                setSettings({ ...defaultSettings, ...data.settings })
            }
        } catch (err) {
            console.error('Failed to load system settings:', err)
            setError('Failed to load system settings')
        } finally {
            setIsLoading(false)
        }
    }, [])

    const updateSettings = useCallback(async (newSettings: Partial<SystemSettings>): Promise<boolean> => {
        try {
            setError(null)

            const mergedSettings = { ...settings, ...newSettings }

            const response = await fetch('/api/system-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: mergedSettings })
            })

            const data = await response.json()

            if (data.success && data.settings) {
                setSettings({ ...defaultSettings, ...data.settings })
                return true
            }

            setError(data.error || 'Failed to save settings')
            return false
        } catch (err) {
            console.error('Failed to save system settings:', err)
            setError('Failed to save system settings')
            return false
        }
    }, [settings])

    // Load settings on mount
    useEffect(() => {
        refreshSettings()
    }, [refreshSettings])

    return (
        <SystemSettingsContext.Provider
            value={{
                settings,
                isLoading,
                error,
                refreshSettings,
                updateSettings
            }}
        >
            {children}
        </SystemSettingsContext.Provider>
    )
}

export function useSystemSettings() {
    const context = useContext(SystemSettingsContext)
    if (context === undefined) {
        throw new Error('useSystemSettings must be used within a SystemSettingsProvider')
    }
    return context
}

// Safe hook that returns defaults if used outside provider
export function useSystemSettingsSafe() {
    const context = useContext(SystemSettingsContext)
    if (context === undefined) {
        return {
            settings: defaultSettings,
            isLoading: false,
            error: null,
            refreshSettings: async () => { },
            updateSettings: async () => false
        }
    }
    return context
}
