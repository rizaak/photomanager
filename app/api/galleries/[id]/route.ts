import { NextRequest } from 'next/server'
import { handleDeleteGallery } from '@/src/modules/galleries/controllers/galleryActionsController'

export const DELETE = (req: NextRequest, ctx: { params: Promise<{ id: string }> }) =>
  handleDeleteGallery(req, ctx)
