import { NextRequest, NextResponse } from 'next/server'
import { LightroomUploadService } from '../services/LightroomUploadService'

export async function handleLightroomUpload(req: NextRequest): Promise<NextResponse> {
  const apiKey = req.headers.get('x-api-key') ?? ''
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Missing X-API-Key header' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid multipart request' }, { status: 400 })
  }

  const fileEntry      = formData.get('file')
  const filename       = String(formData.get('filename') ?? '').trim()
  const origFilename   = String(formData.get('original_filename') ?? '').trim()
  const galleryId      = String(formData.get('gallery_id') ?? '').trim() || undefined
  const galleryName    = String(formData.get('gallery_name') ?? '').trim() || undefined
  const createGallery  = formData.get('create_gallery') === 'true'

  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ success: false, error: 'file field is required' }, { status: 400 })
  }
  if (!filename) {
    return NextResponse.json({ success: false, error: 'filename field is required' }, { status: 400 })
  }

  const mimeType   = fileEntry.type || 'application/octet-stream'
  const fileSize   = fileEntry.size
  const fileBuffer = Buffer.from(await fileEntry.arrayBuffer())

  console.log('[lightroom-upload] incoming request', {
    headers: {
      'content-type': req.headers.get('content-type'),
      'user-agent':   req.headers.get('user-agent'),
      'x-api-key':    apiKey ? `${apiKey.slice(0, 6)}…` : null,
    },
    fields: { filename, origFilename, galleryId, galleryName, createGallery },
    file:   { mimeType, fileSize, name: fileEntry.name },
  })

  try {
    const result = await LightroomUploadService.upload({
      apiKeyPlaintext:  apiKey,
      fileBuffer,
      mimeType,
      filename,
      originalFilename: origFilename,
      fileSize,
      galleryId,
      galleryName,
      createGallery,
    })

    return NextResponse.json(
      { success: true, id: result.id, galleryId: result.galleryId, url: result.url },
      { status: 202 },
    )
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 401) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    if (e.status === 404) return NextResponse.json({ success: false, error: e.message }, { status: 404 })
    if (e.status === 422) return NextResponse.json({ success: false, error: e.message }, { status: 422 })
    if (e.status === 400) return NextResponse.json({ success: false, error: e.message }, { status: 400 })
    console.error('[lightroom-upload]', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
