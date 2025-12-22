import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { checkRateLimit } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = await checkRateLimit('signup', ip, {
      enabled: true,
      maxRequestsPerHour: 5, // Strict limit for signups
      blockDuration: 3600,
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM public.users WHERE email = $1 LIMIT 1', [email])

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const inserted = await query(
      `INSERT INTO public.users (email, name, password, role) 
       VALUES ($1, $2, $3, 'USER')
       RETURNING id, email, name`,
      [email, name, hashedPassword]
    )

    const newUser = inserted.rows[0]

    return NextResponse.json(
      { message: 'User created successfully', user: { id: newUser.id, email: newUser.email, name: newUser.name } },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
