import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rows } = await query('SELECT key, value FROM system_settings ORDER BY key ASC')
    const settingsObject = (rows || []).reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    // Get current settings for audit log
    const currentSettingsResult = await query('SELECT key, value FROM system_settings')
    const currentSettings = (currentSettingsResult.rows || []).reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    const updatedSettings: Record<string, any> = {}
    for (const [key, value] of Object.entries(settings)) {
      const upsertSql = `
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        RETURNING value
      `
      const res = await query(upsertSql, [key, value])
      updatedSettings[key] = res.rows[0]?.value
    }

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'SystemSettings',
      entityId: 'system',
      oldValue: currentSettings,
      newValue: updatedSettings,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
