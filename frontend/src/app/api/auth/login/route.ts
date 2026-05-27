import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const res = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Invalid email or password' },
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
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
  }
}
