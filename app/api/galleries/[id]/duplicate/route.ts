import { NextRequest } from 'next/server'
import { handleDuplicateGallery } from '@/src/modules/galleries/controllers/galleryActionsController'

export const POST = (req: NextRequest, ctx: { params: Promise<{ id: string }> }) =>
  handleDuplicateGallery(req, ctx)
