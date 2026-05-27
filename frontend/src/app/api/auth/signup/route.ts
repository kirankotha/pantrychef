import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    const res = await fetch(`${process.env.BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Registration failed' },
        { status: res.status }
      )
    }
    const response = NextResponse.json(data)
    response.cookies.set('pantrychef_auth', data.access_token, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Sign up failed. Please try again.' }, { status: 500 })
  }
}
