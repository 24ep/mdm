import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import nodemailer from 'nodemailer'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id
    const body = await request.json()
    const { email, role = 'member' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if current user has permission to invite members
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get space details
    const spaceResult = await query(`
      SELECT name, description FROM spaces WHERE id = $1
    `, [spaceId])

    if (spaceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    const space = spaceResult.rows[0]

    // Check if user already exists
    const existingUser = await query(`
      SELECT id, name, email FROM users WHERE email = $1 AND is_active = true
    `, [email])

    if (existingUser.rows.length > 0) {
      // User exists, add them to the space directly
      const user = existingUser.rows[0]
      
      // Check if they're already a member
      const existingMember = await query(`
        SELECT id FROM space_members WHERE space_id = $1 AND user_id = $2
      `, [spaceId, user.id])

      if (existingMember.rows.length > 0) {
        return NextResponse.json({ error: 'User is already a member of this space' }, { status: 400 })
      }

      // Add user to space
      await query(`
        INSERT INTO space_members (space_id, user_id, role)
        VALUES ($1, $2, $3)
      `, [spaceId, user.id, role])

      return NextResponse.json({
        success: true,
        message: 'User added to space successfully',
        user: user
      })
    }

    // User doesn't exist, send invitation email
    const invitationToken = generateInvitationToken()
    
    // Store invitation in database
    await query(`
      INSERT INTO space_invitations (space_id, email, role, token, invited_by, expires_at)
      VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')
    `, [spaceId, email, role, invitationToken, session.user.id])

    // Send invitation email
    await sendInvitationEmail(email, space.name, invitationToken, session.user.name || 'Admin')

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      email: email
    })
  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

async function sendInvitationEmail(
  email: string, 
  spaceName: string, 
  token: string, 
  inviterName: string
) {
  try {
    // Get SMTP settings from environment or database
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    }

    const transporter = nodemailer.createTransporter(smtpConfig)

    const invitationUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `You're invited to join ${spaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're invited to join ${spaceName}</h2>
          <p>Hello!</p>
          <p><strong>${inviterName}</strong> has invited you to join the space <strong>"${spaceName}"</strong> in our MDM platform.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If the button doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${invitationUrl}">${invitationUrl}</a>
          </p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending invitation email:', error)
    throw error
  }
}
