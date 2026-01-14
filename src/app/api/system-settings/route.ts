'use server'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Default system settings
const defaultSettings = {
    appName: 'Unified Data Platform',
    deletePolicyDays: 30,
    enableAuditTrail: true,
    enableNotifications: true,
    enableThemeConfig: true,
    enableUserRegistration: true,
    requireEmailVerification: true,
    requireAdminApproval: false
}

// GET /api/system-settings - Get current system settings
export async function GET() {
    try {
        // Try to get settings from database
        const settingsRecord = await prisma.systemSetting.findUnique({
            where: { key: 'global' }
        })

        if (settingsRecord) {
            try {
                const parsedValue = JSON.parse(settingsRecord.value)
                return NextResponse.json({
                    success: true,
                    settings: { ...defaultSettings, ...parsedValue }
                })
            } catch {
                // If parsing fails, return default settings
                return NextResponse.json({
                    success: true,
                    settings: defaultSettings
                })
            }
        }

        // Return default settings if none exist
        return NextResponse.json({
            success: true,
            settings: defaultSettings
        })
    } catch (error) {
        console.error('Failed to load system settings:', error)
        // Return default settings on error
        return NextResponse.json({
            success: true,
            settings: defaultSettings
        })
    }
}

// PUT /api/system-settings - Update system settings
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { settings } = body

        if (!settings) {
            return NextResponse.json(
                { success: false, error: 'Settings object is required' },
                { status: 400 }
            )
        }

        // Merge with defaults to ensure all fields exist
        const mergedSettings = { ...defaultSettings, ...settings }

        // Upsert settings in database (store as JSON string)
        const result = await prisma.systemSetting.upsert({
            where: { key: 'global' },
            update: {
                value: JSON.stringify(mergedSettings),
                updatedAt: new Date()
            },
            create: {
                key: 'global',
                value: JSON.stringify(mergedSettings)
            }
        })

        return NextResponse.json({
            success: true,
            settings: mergedSettings
        })
    } catch (error) {
        console.error('Failed to save system settings:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to save settings' },
            { status: 500 }
        )
    }
}
