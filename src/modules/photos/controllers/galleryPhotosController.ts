import { NextRequest, NextResponse } from 'next/server'
import { GalleryPhotosService } from '../services/GalleryPhotosService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'
import type { PhotoListParams } from '../repositories/PhotoRepository'

const VALID_STATUSES = new Set(['processing', 'ready', 'selected', 'editing', 'final_ready', 'failed'])
const VALID_SORTS    = new Set(['date_desc', 'date_asc', 'filename', 'selected_first', 'final_first'])

export async function handleGetGalleryPhotos(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  try {
    // Dashboard paginated + filtered mode
    if (req.nextUrl.searchParams.has('dashboard')) {
      const sp = req.nextUrl.searchParams

      const rawStatus = sp.get('status') ?? undefined
      const rawSort   = sp.get('sort')   ?? undefined
      const rawLabels = sp.get('labels')?.split(',').filter(Boolean)

      const listParams: PhotoListParams = {
        q:             sp.get('q')             ?? undefined,
        sectionId:     sp.get('sectionId')     ?? undefined,
        clientSelected: sp.get('clientSelected') === 'true' || undefined,
        hasComments:   sp.get('hasComments')   === 'true' || undefined,
        hasFinal:      sp.get('hasFinal')      === 'true' || undefined,
        status:        rawStatus && VALID_STATUSES.has(rawStatus) ? rawStatus : undefined,
        sort:          rawSort   && VALID_SORTS.has(rawSort)      ? rawSort   : undefined,
        labels:        rawLabels?.length ? rawLabels : undefined,
        page:          Math.max(1, parseInt(sp.get('page') ?? '1') || 1),
      }

      const data = await GalleryPhotosService.listForDashboard(id, listParams)
      return NextResponse.json(data)
    }

    // Full gallery load — filter hidden sections for unauthenticated (public) clients.
    // Authenticated photographers get all sections (for cover photo selector, etc.).
    let isPhotographer = false
    try {
      await getAuthenticatedPhotographer()
      isPhotographer = true
    } catch { /* public access */ }

    const data = await GalleryPhotosService.getForGallery(id, { publicOnly: !isPhotographer })
    if (!data) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[galleryPhotos]', err)
    return NextResponse.json({ error: 'Failed to load gallery' }, { status: 500 })
  }
}
