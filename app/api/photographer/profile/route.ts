import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { prisma } from '@/src/infrastructure/database/db'

export async function PATCH(req: NextRequest) {
  try {
    const photographerId = await getAuthenticatedPhotographer()
    const body = await req.json()

    const name         = typeof body.name         === 'string' ? body.name.trim()         : undefined
    const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : undefined

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const profile = await prisma.photographerProfile.findUnique({
      where:  { id: photographerId },
      select: { userId: true },
    })
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await Promise.all([
      prisma.user.update({
        where: { id: profile.userId },
        data:  { name },
      }),
      prisma.photographerProfile.update({
        where: { id: photographerId },
        data:  { businessName: businessName ?? null },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status })
  }
}
