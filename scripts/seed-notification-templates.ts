import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const templates = [
    {
      key: 'login-alert',
      name: 'Login Alert',
      type: 'email',
      subject: 'Security Alert: New Login Detected',
      content: `<div style="font-family: Arial, sans-serif; color: #333;">
  <h2>New Login Detected</h2>
  <p>Hello <strong>{{name}}</strong>,</p>
  <p>We detected a new login to your account associated with <strong>{{email}}</strong>.</p>
  <p><strong>Time:</strong> {{time}}</p>
  <br/>
  <p>If this was you, you can safely ignore this email.</p>
  <p>If you did not authorize this login, please contact support immediately.</p>
</div>`,
      variables: ['name', 'email', 'time']
    },
    {
      key: 'reset-password',
      name: 'Reset Password',
      type: 'email',
      subject: 'Reset Your Password',
      content: `<div style="font-family: Arial, sans-serif; color: #333;">
  <h2>Reset Your Password</h2>
  <p>Hello <strong>{{name}}</strong>,</p>
  <p>You have requested to reset your password.</p>
  <p>Please click the link below to reset it:</p>
  <p><a href="{{link}}">Reset Password</a></p>
  <br/>
  <p>If you did not request this, please ignore this email.</p>
</div>`,
      variables: ['name', 'link']
    },
    {
      key: '2fa-verify',
      name: '2FA Verification',
      type: 'email',
      subject: 'Your Verification Code',
      content: `<div style="font-family: Arial, sans-serif; color: #333;">
  <h2>Verification Code</h2>
  <p>Hello <strong>{{name}}</strong>,</p>
  <p>Your verification code is:</p>
  <h1 style="color: #0070f3;">{{code}}</h1>
  <p>This code will expire in 10 minutes.</p>
</div>`,
       variables: ['name', 'code']
    }
  ]

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { key: t.key },
      update: t,
      create: t,
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
