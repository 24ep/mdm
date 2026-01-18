import nodemailer from 'nodemailer'
import { query } from '@/lib/db'

interface SmtpSettings {
  host: string
  port: number
  user: string
  pass: string
  secure: boolean
  from: string
}

async function getSmtpSettings(): Promise<SmtpSettings | null> {
  try {
    const { rows } = await query("SELECT key, value FROM system_settings WHERE key IN ('smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpSecure', 'orgEmail', 'siteName')")
    
    if (!rows || rows.length === 0) {
        return null
    }

    const settings = rows.reduce((acc: any, row: any) => {
      // Handle "true"/"false" strings for boolean values if stored that way
      if (row.value === 'true') acc[row.key] = true
      else if (row.value === 'false') acc[row.key] = false
      else acc[row.key] = row.value
      return acc
    }, {})

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      return null
    }

    return {
      host: settings.smtpHost,
      port: Number(settings.smtpPort) || 587,
      user: settings.smtpUser,
      pass: settings.smtpPassword,
      secure: settings.smtpSecure === true, // Already converted in reduce
      from: settings.orgEmail || `noreply@${(settings.siteName || 'system').toLowerCase().replace(/\s+/g, '')}.com`
    }
  } catch (error) {
    console.error('Failed to fetch SMTP settings:', error)
    return null
  }
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const settings = await getSmtpSettings()
  if (!settings) {
    console.warn('SMTP settings not configured, email not sent to:', to)
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.user,
        pass: settings.pass,
      },
    })

    await transporter.sendMail({
      from: settings.from,
      to,
      subject,
      html,
    })

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}
