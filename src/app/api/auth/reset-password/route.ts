import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import crypto from 'crypto'

// POST /api/auth/reset-password - request a reset token
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })
    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30) // 30 minutes

    await query(
      `CREATE TABLE IF NOT EXISTS public.password_resets (
        token TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ
      )`
    )

    const { rows } = await query('SELECT id FROM public.users WHERE email = $1 LIMIT 1', [email])
    if (!rows.length) return NextResponse.json({ success: true }) // do not reveal existence

    await query('DELETE FROM public.password_resets WHERE user_id = $1', [rows[0].id])
    await query('INSERT INTO public.password_resets (token, user_id, expires_at) VALUES ($1, $2, $3)', [token, rows[0].id, expiresAt])

    return NextResponse.json({ success: true, token, expires_at: expiresAt.toISOString() })
  } catch (error) {
    console.error('Reset password request error:', error)
    return NextResponse.json({ error: 'Internal server error'  })
}

// PUT /api/auth/reset-password - consume reset token and set new password
export async function PUT(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) return NextResponse.json({ error: 'token and password required' }, { status: 400 })

    const { rows } = await query('SELECT user_id, expires_at, used_at FROM public.password_resets WHERE token = $1 LIMIT 1', [token])
    if (!rows.length) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    const pr = rows[0]
    if (pr.used_at || new Date(pr.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Expired token'  })

    const bcrypt = await import('bcryptjs')
    const hashed = await bcrypt.hash(password, 12)
    await query('UPDATE public.users SET password = $1 WHERE id = $2', [hashed, pr.user_id])
    await query('UPDATE public.password_resets SET used_at = NOW() WHERE token = $1', [token])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error'  })
}


