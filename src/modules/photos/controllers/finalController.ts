import { NextRequest, NextResponse } from 'next/server'
import { PhotoService } from '../services/PhotoService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

// POST /api/photos/[id]/final
export async function handleUploadFinal(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id: photoId } = await params

  let formData: FormData
  try { formData = await req.formData() }
  catch { return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 }) }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field is required' }, { status: 400 })
  }

  try {
    const result = await PhotoService.uploadFinal(photoId, file, photographerId)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (e.status === 422) return NextResponse.json({ error: e.message }, { status: 422 })
    console.error('[photo final POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
