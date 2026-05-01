import { NextRequest } from 'next/server'
import { handleRenameFolder, handleDeleteFolder } from '@/src/modules/galleries/controllers/GalleryFolderController'

export const PATCH  = (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => handleRenameFolder(req, ctx)
export const DELETE = (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => handleDeleteFolder(req, ctx)
