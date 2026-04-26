import { NextResponse } from 'next/server'
import { UsageService } from '../services/UsageService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

// GET /api/photographer/usage
export async function handleGetUsage(): Promise<NextResponse> {
  let photographerId: string
  try {
    photographerId = await getAuthenticatedPhotographer()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const usage = await UsageService.getUsage(photographerId)
    return NextResponse.json(usage)
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    if (status < 500) {
      const msg = err instanceof Error ? err.message : 'Not found'
      return NextResponse.json({ error: msg }, { status })
    }
    console.error('[photographer usage GET]', err)
    return NextResponse.json({ error: 'Failed to load usage' }, { status: 500 })
  }
}
