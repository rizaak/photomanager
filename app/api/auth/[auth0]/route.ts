export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

// Auth0 v4 handles /api/auth/* routes via middleware.
// This file satisfies Next.js route type requirements.
export function GET()  { return NextResponse.json({ error: 'Not found' }, { status: 404 }) }
export function POST() { return NextResponse.json({ error: 'Not found' }, { status: 404 }) }
