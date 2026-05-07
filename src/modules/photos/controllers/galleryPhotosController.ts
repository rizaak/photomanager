import { NextRequest, NextResponse } from 'next/server'
import { GalleryPhotosService } from '../services/GalleryPhotosService'
import { GalleryService } from '../../galleries/services/GalleryService'
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
        hasFavorites:   sp.get('hasFavorites')   === 'true' || undefined,
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

    // Full gallery load.
    // Always publicOnly by default — the public client gallery must never see hidden sections.
    // ?includeHidden=1 bypasses the filter only when the authenticated photographer owns the gallery
    // (used by the photographer's preview and settings cover-photo selector).
    let includeHidden = false
    if (req.nextUrl.searchParams.get('includeHidden') === '1') {
      try {
        const photographerId = await getAuthenticatedPhotographer()
        const gallery        = await GalleryService.getDetail(id, photographerId)
        includeHidden        = !!gallery
      } catch { /* not owner — stay filtered */ }
    }

    const data = await GalleryPhotosService.getForGallery(id, { publicOnly: !includeHidden })
    if (!data) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[galleryPhotos]', err)
    return NextResponse.json({ error: 'Failed to load gallery' }, { status: 500 })
  }
}
