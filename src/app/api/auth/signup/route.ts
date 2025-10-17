import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await query<any>('SELECT id FROM public.users WHERE email = $1 LIMIT 1', [email])

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const inserted = await query<any>(
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
      { error: 'Internal server error', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
